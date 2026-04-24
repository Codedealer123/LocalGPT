import * as webllm from "@mlc-ai/web-llm";

/** @type {string | null} */
let currentModel = null;

/**
 * @param {{ role: string, content: string }[]} messages
 * @returns {import("@mlc-ai/web-llm").ChatCompletionMessageParam[]}
 */
function mapMessagesForWorker(messages) {
    return messages.map((msg) => ({
        role: /** @type {"user" | "assistant" | "system"} */ (msg.role),
        content: msg.content
    }));
}

/**
 * @param {object} progressReport
 */
const initProgressCallback = (progressReport) => {
  // console.log(progressReport)
  self.postMessage({ type: "progress", progress: progressReport });
};

// @ts-ignore
const engineInstance = new webllm.MLCEngine({ initProgressCallback });

const modelList = webllm.prebuiltAppConfig.model_list;

// send models on load
self.postMessage({ type: "models", models: modelList });

/**
 * @param {MessageEvent<{
 *   requestId: number,
 *   modelID: string,
 *   messages: { role: string, content: string }[]
 * }>} msg
 */
self.onmessage = async (msg) => {
    const { requestId, modelID, messages } = msg.data;

    if (msg.data?.type === "requestModels") {
        self.postMessage({ type: "models", models: modelList });
        return;
    }

    if (!modelID) {
        self.postMessage({
            requestId,
            type: "error",
            error: "Please select a model before sending a message."
        });
        return;
    }

    if (!messages?.length) {
        self.postMessage({
            requestId,
            type: "error",
            error: "No messages provided"
        });
        return;
    }

    try {
        // 🔄 Load model if needed
        if (modelID !== currentModel) {
            await engineInstance.reload(modelID);
            currentModel = modelID;
        }

        const mappedMessages = mapMessagesForWorker(messages);

        const chunks = await engineInstance.chat.completions.create({
            messages: mappedMessages,
            stream: true,
            stream_options: { include_usage: true }
        });

        let reply = "";

        // 🔥 STREAM LOOP
        for await (const chunk of chunks) {
            const token = chunk.choices?.[0]?.delta?.content || "";

            if (token) {
                reply += token;

                self.postMessage({
                    requestId,
                    type: "stream",
                    token,
                    full: reply
                });
            }

            if (chunk.usage) {
                self.postMessage({
                    requestId,
                    type: "usage",
                    usage: chunk.usage
                });
            }
        }

        // ✅ FINAL RESPONSE
        self.postMessage({
            requestId,
            type: "done",
            data: {
                response: {
                    role: "assistant",
                    content: reply
                }
            }
        });

    } catch (err) {
        self.postMessage({
            requestId,
            type: "error",
            error: err?.message || String(err)
        });
    }
};
