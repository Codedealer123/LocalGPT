import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ai controller", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("matches worker completions to the correct request id while preserving the public return shape", async () => {
    const listeners = new Set();
    const postedMessages = [];

    const worker = {
      addEventListener(event, handler) {
        if (event === "message") {
          listeners.add(handler);
        }
      },
      removeEventListener(event, handler) {
        if (event === "message") {
          listeners.delete(handler);
        }
      },
      postMessage(payload) {
        postedMessages.push(payload);
      },
      terminate: vi.fn(),
    };

    vi.doMock("./store.js", async () => {
      const { writable } = await import("svelte/store");
      return {
        currentModel: writable("model-a"),
        selectedChatId: writable("chat-1"),
        aiWorker: worker,
      };
    });

    vi.doMock("./chats.js", () => ({
      getChatMessages: vi
        .fn()
        .mockResolvedValue([{ role: "user", content: "Hello" }]),
    }));

    const { askAI, terminateWorker } = await import("./aiController.js");

    const pendingReply = askAI();
    await Promise.resolve();

    expect(postedMessages).toHaveLength(1);
    expect(postedMessages[0]).toEqual(
      expect.objectContaining({
        requestId: expect.any(Number),
        modelID: "model-a",
        messages: [{ role: "user", content: "Hello" }],
      }),
    );

    for (const handler of listeners) {
      handler({
        data: {
          type: "done",
          requestId: postedMessages[0].requestId + 1,
          data: { response: { content: "Wrong" } },
        },
      });
    }

    let settled = false;
    pendingReply.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    for (const handler of listeners) {
      handler({
        data: {
          type: "done",
          requestId: postedMessages[0].requestId,
          data: {
            response: { content: "Correct", role: "assistant" },
            usage: { total_tokens: 5 },
          },
        },
      });
    }

    await expect(pendingReply).resolves.toEqual({
      response: { content: "Correct", role: "assistant" },
      usage: { total_tokens: 5 },
    });

    terminateWorker();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
});
