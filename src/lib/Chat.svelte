<script>
    import { get, tick } from "svelte/store";
    import VirtualList from '@sveltejs/svelte-virtual-list';
    import { currentChatMessages, postMessage } from "./js/chats.js";
    import { selectedChatId, currentModel, aiWorker } from "./js/store.js";
    import Input from "./Input.svelte";
    import './css/chat.css'

    let promptInput = "";
    let onSend = () => handleSend();
    let isSending = false;
    let streamingMessage = "";
    let chatListHost;

    let requestCounter = 0;

    $: renderedMessages = streamingMessage
      ? [...$currentChatMessages, { id: 'streaming', role: 'assistant', content: streamingMessage }]
      : $currentChatMessages;

    async function scrollChatToBottom() {
      await tick();
      const viewport = chatListHost?.querySelector('svelte-virtual-list-viewport');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }

    $: if (renderedMessages.length) {
      void scrollChatToBottom();
    }

    async function handleSend() {
      const content = promptInput.trim();
      if (!content || isSending) return;

      isSending = true;
      promptInput = "";

      try {
        await postMessage(content, "user");
        const replyChatId = get(selectedChatId);

        const messages = get(currentChatMessages);
        const requestId = ++requestCounter;

        streamingMessage = "";

        if (!aiWorker) {
          throw new Error("AI worker is not available");
        }

        await new Promise((resolve, reject) => {
          const handler = (e) => {
            const data = e.data;

            if (data.requestId !== requestId) return;

            if (data.type === "stream") {
              streamingMessage = data.full;
            }

            if (data.type === "done") {
              cleanup();
              resolve(data.data);
            }

            if (data.type === "error") {
              cleanup();
              reject(data.error);
            }
          };

          const cleanup = () => {
            aiWorker.removeEventListener("message", handler);
          };

          aiWorker.addEventListener("message", handler);

          aiWorker.postMessage({
            requestId,
            modelID: get(currentModel),
            messages
          });
        }).then(async (result) => {
          if (get(selectedChatId) !== replyChatId) return;

          await postMessage(result.response.content, "assistant");
          streamingMessage = "";
        });

      } catch (error) {
        console.error("Failed to send message", error);
      } finally {
        isSending = false;
      }
    }
</script>

<div class="chat-area" class:chat-active={renderedMessages.length > 0}>
  {#if $currentChatMessages.length == 0}
    <h1 class="greeting">What can I help with?</h1>

    <div class="input-container">
      <div class="input-wrapper">
        <Input bind:promptInput={promptInput} onSend={onSend} disabled={isSending} />
      </div>
    </div>
  {:else}
    <div class="chat-messages" bind:this={chatListHost}>
      <VirtualList items={renderedMessages} height="100%" let:item>
        <div class={item.role === "user" ? "user-message" : "assistant-message"}>
          <div class={item.role === "user" ? "user-bubble" : "assistant-bubble"}>
            {item.content}
          </div>
        </div>
      </VirtualList>
    </div>

    <div class="chat-input-wrapper">
        <Input bind:promptInput={promptInput} onSend={onSend} disabled={isSending} />
    </div>
  {/if}
</div>
