import { get } from "svelte/store";
import { currentModel, aiWorker, selectedChatId } from "./store.js";
import { getChatMessages } from "./chats.js";

let nextRequestId = 1;

export function askAI() {
    return new Promise(async (resolve, reject) => {
        if (!aiWorker) {
            return reject("AI worker is not available");
        }

        const chatID = get(selectedChatId);
        const messages = chatID ? await getChatMessages(chatID) : null;

        if (!messages?.length) {
            return reject("No message available");
        }

        const requestId = nextRequestId++;

        const handler = (e) => {
            if (e.data?.type !== "reply" || e.data?.requestId !== requestId) {
                return;
            }

            aiWorker.removeEventListener("message", handler);
            resolve(e.data.data);
        };

        aiWorker.addEventListener("message", handler);

        aiWorker.postMessage({
            requestId,
            modelID: get(currentModel),
            messages
        });
    });
}

export function terminateWorker() {
    if (!aiWorker) return;

    aiWorker.terminate();
}
