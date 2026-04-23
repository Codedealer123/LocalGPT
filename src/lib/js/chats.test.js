import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";

function createMemoryDb() {
  const data = new Map();

  return {
    data,
    async setItem(key, value) {
      data.set(key, structuredClone(value));
      return true;
    },
    async getItem(key) {
      return data.has(key) ? structuredClone(data.get(key)) : null;
    },
    async removeItem(key) {
      data.delete(key);
      return true;
    },
    async clear() {
      data.clear();
      return true;
    },
  };
}

describe("chat api", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("creates a chat on first post and updates the active message store immediately", async () => {
    const db = createMemoryDb();

    vi.doMock("./Databases.js", () => ({
      mainDB: db,
    }));

    vi.doMock("./aiController.js", () => ({
      askAI: vi.fn(),
    }));

    const chatsModule = await import("./chats.js");
    const storeModule = await import("./store.js");

    await chatsModule.postMessage("Hello there", "user");

    const allChats = get(chatsModule.chats);
    const activeChatId = get(storeModule.selectedChatId);
    const activeMessages = get(chatsModule.currentChatMessages);

    expect(allChats).toHaveLength(1);
    expect(activeChatId).toBe(allChats[0].id);
    expect(allChats[0].title).toBe("Hello there");
    expect(activeMessages).toEqual([
      expect.objectContaining({ content: "Hello there", role: "user" }),
    ]);
    expect(await chatsModule.getChatMessages(activeChatId)).toEqual(
      activeMessages,
    );
  });

  it("keeps the exported synchronous and async last-message helpers aligned for the active chat", async () => {
    const db = createMemoryDb();

    vi.doMock("./Databases.js", () => ({
      mainDB: db,
    }));

    vi.doMock("./aiController.js", () => ({
      askAI: vi.fn(),
    }));

    const chatsModule = await import("./chats.js");
    const storeModule = await import("./store.js");

    const chatId = await chatsModule.createChat("Debug");
    chatsModule.setCurrentChatId(chatId);
    await chatsModule.addMessageToChat("First", "user");
    await chatsModule.addMessageToChat("Second", "assistant");

    expect(chatsModule.getLastMessage(get(storeModule.selectedChatId))).toEqual(
      expect.objectContaining({ content: "Second", role: "assistant" }),
    );
    await expect(chatsModule.getLastMessageAsync(chatId)).resolves.toEqual(
      expect.objectContaining({ content: "Second", role: "assistant" }),
    );
  });

  it("routes replyToUser through the original exported api and persists the assistant text", async () => {
    const db = createMemoryDb();
    const askAI = vi.fn().mockResolvedValue({
      response: { content: "Assistant reply", role: "assistant" },
      usage: { total_tokens: 12 },
    });

    vi.doMock("./Databases.js", () => ({
      mainDB: db,
    }));

    vi.doMock("./aiController.js", () => ({
      askAI,
    }));

    const chatsModule = await import("./chats.js");

    const chatId = await chatsModule.createChat("Reply test");
    chatsModule.setCurrentChatId(chatId);
    await chatsModule.addMessageToChat("Prompt", "user");
    await chatsModule.replyToUser();

    await expect(chatsModule.getLastMessageAsync(chatId)).resolves.toEqual(
      expect.objectContaining({
        content: "Assistant reply",
        role: "assistant",
      }),
    );
    expect(askAI).toHaveBeenCalledTimes(1);
  });

  it("updates the message-count subscription when switching chats", async () => {
    const db = createMemoryDb();

    vi.doMock("./Databases.js", () => ({
      mainDB: db,
    }));

    vi.doMock("./aiController.js", () => ({
      askAI: vi.fn(),
    }));

    const chatsModule = await import("./chats.js");

    const counts = [];
    const unsubscribe = chatsModule.subscribeMessageCount((count) => {
      counts.push(count);
    });

    const firstChatId = await chatsModule.createChat("One");
    chatsModule.setCurrentChatId(firstChatId);
    await chatsModule.addMessageToChat("A", "user");

    const secondChatId = await chatsModule.createChat("Two");
    chatsModule.setCurrentChatId(secondChatId);
    await chatsModule.addMessageToChat("B", "user");
    await chatsModule.addMessageToChat("C", "assistant");

    unsubscribe();

    expect(counts).toContain(0);
    expect(counts).toContain(1);
    expect(counts).toContain(2);
  });

  it("creates unique chat ids for rapid successive chats", async () => {
    const db = createMemoryDb();

    vi.doMock("./Databases.js", () => ({
      mainDB: db,
    }));

    vi.doMock("./aiController.js", () => ({
      askAI: vi.fn(),
    }));

    const chatsModule = await import("./chats.js");

    const firstChatId = await chatsModule.createChat("One");
    const secondChatId = await chatsModule.createChat("Two");

    expect(firstChatId).not.toBe(secondChatId);
  });
});
