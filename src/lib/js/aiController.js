import { get } from "svelte/store";
import { currentModel, aiWorker, selectedChatId } from "./store.js";
import { getChatMessages } from "./chats.js";

let nextRequestId = 1;

export function askAI(options = {}) {
    return new Promise(async (resolve, reject) => {
        if (!aiWorker) {
            return reject("AI worker is not available");
        }

        const { onStream, onUsage } = options;

        const chatID = get(selectedChatId);
        const messages = chatID ? await getChatMessages(chatID) : null;

        if (!messages?.length) {
            return reject("No message available");
        }

        const requestId = nextRequestId++;

        const handler = (event) => {
            const data = event.data ?? {};

            if (data.requestId !== requestId) {
                return;
            }

            if (data.type === "done") {
                aiWorker.removeEventListener("message", handler);
                resolve(data.data);
            }

            if (data.type === "stream") {
                onStream?.(data);
            }

            if (data.type === "usage") {
                onUsage?.(data.usage);
            }

            if (data.type === "error") {
                aiWorker.removeEventListener("message", handler);
                reject(data.error);
            }
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
