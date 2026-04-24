import { get, writable } from 'svelte/store';
import { selectedChatId } from './store.js';
import { askAI } from './aiController.js';
import { mainDB } from './Databases.js';

/**
 * @typedef {Object} Message
 * @property {number} id
 * @property {string} content
 * @property {string} role
 */

/**
 * @typedef {Object} Chat
 * @property {string} id
 * @property {string} title
 */

/** @type {import('svelte/store').Writable<Chat[]>} */
export const chats = writable([]);
export const currentChatMessages = writable([]);

const messageCounts = new Map();
const CHAT_INDEX_KEY = 'chatIndex';
const LEGACY_CHATS_KEY = 'chats';
let latestMessagesLoadToken = 0;
let chatIdCounter = 0;

/**
 * @param {string} chatId
 */
function getChatMessagesKey(chatId) {
    return `chat:${chatId}:messages`;
}

/**
 * @param {Chat[]} chatIndex
 */
async function saveChatIndex(chatIndex) {
    await mainDB.setItem(CHAT_INDEX_KEY, chatIndex);
}

function generateChatId() {
    const timestamp = Date.now();
    chatIdCounter += 1;
    return `${timestamp}-${chatIdCounter}`;
}

/**
 * @param {string} chatID
 */
function ensureMessageCountStore(chatID) {
    if (messageCounts.has(chatID)) {
        return messageCounts.get(chatID);
    }

    const countStore = writable(0);
    messageCounts.set(chatID, countStore);

    void getChatMessages(chatID).then((messages) => {
        if (messageCounts.get(chatID) === countStore) {
            countStore.set(messages.length);
        }
    });

    return countStore;
}

/**
 * @param {string | null | undefined} chatID
 */
export async function loadCurrentChatMessages(chatID) {
    const loadToken = ++latestMessagesLoadToken;

    if (!chatID) {
        currentChatMessages.set([]);
        return [];
    }

    const messages = await getChatMessages(chatID);

    if (loadToken === latestMessagesLoadToken && get(selectedChatId) === chatID) {
        currentChatMessages.set(messages);
    }

    return messages;
}

/**
 * @param {string} [title]
 */
export async function createChat(title = 'New Chat') {
    const newChat = {
        id: generateChatId(),
        title
    };

    const updatedChats = [...get(chats), newChat];
    chats.set(updatedChats);
    await saveChatIndex(updatedChats);
    await mainDB.setItem(getChatMessagesKey(newChat.id), []);
    messageCounts.set(newChat.id, writable(0));

    return newChat.id;
}

export async function syncChats() {
    const storedChats = await mainDB.getItem(CHAT_INDEX_KEY);

    if (!storedChats) {
        chats.set([]);
        return [];
    }

    chats.set(storedChats);
    return storedChats;
}

export async function deleteChats() {
    const currentChats = get(chats);

    for (const chat of currentChats) {
        await mainDB.removeItem(getChatMessagesKey(chat.id));
    }

    await mainDB.removeItem(CHAT_INDEX_KEY);
    await mainDB.removeItem(LEGACY_CHATS_KEY);
    chats.set([]);
    currentChatMessages.set([]);
    messageCounts.clear();
}

/**
 * @param {string} chatId
 */
export async function deleteChat(chatId) {
    const updatedChats = get(chats).filter((chat) => chat.id !== chatId);
    chats.set(updatedChats);
    messageCounts.delete(chatId);

    await saveChatIndex(updatedChats);
    await mainDB.removeItem(getChatMessagesKey(chatId));

    if (get(selectedChatId) === chatId) {
        setCurrentChatId(null);
    }
}

/**
 * @param {string} id
 */
export function getChatById(id) {
    return get(chats).find((chat) => chat.id === id);
}

/**
 * @param {string} chatID
 * @returns {Promise<Message[]>}
 */
export async function getChatMessages(chatID) {
    return await mainDB.getItem(getChatMessagesKey(chatID)) || [];
}

/**
 * @param {string} chatID
 * @param {Message[]} messages
 */
function syncMessageState(chatID, messages) {
    if (get(selectedChatId) === chatID) {
        currentChatMessages.set(messages);
    }

    if (!messageCounts.has(chatID)) {
        messageCounts.set(chatID, writable(messages.length));
    } else {
        messageCounts.get(chatID).set(messages.length);
    }
}

/**
 * @param {string} chatID
 * @param {string} title
 */
async function renameChat(chatID, title) {
    const updatedChats = get(chats).map((chat) =>
        chat.id === chatID ? { ...chat, title } : chat
    );

    chats.set(updatedChats);
    await saveChatIndex(updatedChats);
}

/**
 * @param {string} message
 * @param {string} role
 */
export async function addMessageToChat(message, role) {
    const id = get(selectedChatId);
    if (!id) {
        console.error('No chat selected');
        return;
    }

    let chat = getChatById(id);
    if (!chat) {
        await syncChats();
        chat = getChatById(id);
    }

    if (!chat) {
        console.error(`Chat with id ${id} not found`);
        return;
    }

    const existingMessages = await getChatMessages(id);
    const nextMessages = [...existingMessages, { id: Date.now(), content: message, role }];

    syncMessageState(id, nextMessages);
    await mainDB.setItem(getChatMessagesKey(id), nextMessages);

    if (role === 'user' && chat.title === 'New Chat') {
        await renameChat(id, message.slice(0, 40).trim() || 'New Chat');
    }
}

/**
 * @param {(value: number) => void} callback
 * @returns {() => void}
 */
export function subscribeMessageCount(callback) {
    let activeCountUnsubscribe = () => {};

    const unsubscribeSelected = selectedChatId.subscribe((chatID) => {
        activeCountUnsubscribe();
        activeCountUnsubscribe = () => {};

        if (!chatID) {
            callback(0);
            return;
        }

        const countStore = ensureMessageCountStore(chatID);
        activeCountUnsubscribe = countStore.subscribe(callback);
    });

    return () => {
        activeCountUnsubscribe();
        unsubscribeSelected();
    };
}

/**
 * @param {string} chatID
 */
export function getLastMessage(chatID) {
    if (get(selectedChatId) === chatID) {
        const messages = get(currentChatMessages);
        return messages[messages.length - 1] || null;
    }

    console.warn('getLastMessage only returns synchronously for the active chat. Use getLastMessageAsync instead.');
    return null;
}

/**
 * @param {string} chatID
 */
export async function getLastMessageAsync(chatID) {
    const messages = await getChatMessages(chatID);
    return messages[messages.length - 1] || null;
}

/**
 * @param {string | null} chatID
 */
export function setCurrentChatId(chatID) {
    selectedChatId.set(chatID);
    void loadCurrentChatMessages(chatID);
}

/**
 * @param {string} message
 * @param {string} role
 */
export async function postMessage(message, role) {
    if (!get(selectedChatId)) {
        const chatID = await createChat();
        setCurrentChatId(chatID);
    }

    await addMessageToChat(message, role);
}

export async function replyToUser(options = {}) {
    const response = await askAI(options);
    await postMessage(response.response.content, 'assistant');
    return response;
}

selectedChatId.subscribe((chatID) => {
    void loadCurrentChatMessages(chatID);
});
