<script>
  import { tick } from 'svelte';
  import Input from './Input.svelte';
  import { currentChatMessages, postMessage, replyToUser } from './js/chats.js';
  import { currentModel, progress } from './js/store.js';
  import { markdownToHtml } from './js/markdown.js';

  let promptInput = '';
  let isThinking = false;
  let streamingReply = '';
  let messagesViewport;

  async function scrollToBottom() {
    await tick();
    if (!messagesViewport) return;
    messagesViewport.scrollTop = messagesViewport.scrollHeight;
  }

  async function sendPrompt() {
    const trimmed = promptInput.trim();

    if (!trimmed || isThinking || !$currentModel) {
      return;
    }

    promptInput = '';
    streamingReply = '';
    isThinking = true;

    try {
      await postMessage(trimmed, 'user');
      await scrollToBottom();

      await replyToUser({
        onStream: ({ full }) => {
          streamingReply = full ?? '';
          void scrollToBottom();
        }
      });

      streamingReply = '';
    } catch (error) {
      streamingReply = '';
      await postMessage(`Error: ${error?.message ?? error}`, 'assistant');
    } finally {
      isThinking = false;
      await scrollToBottom();
      document.querySelector('.prompt-input')?.focus();
    }
  }

  $: messages = $currentChatMessages ?? [];
  $: hasMessages = messages.length > 0;
  $: progressText = $progress?.text ?? $progress?.status ?? '';
  $: if (hasMessages || streamingReply || isThinking) {
    scrollToBottom();
  }
  $: renderedStreamingReply = markdownToHtml(streamingReply);
</script>

<section class="chat-area">
  {#if hasMessages || streamingReply || isThinking}
    <div class="chat-messages" bind:this={messagesViewport}>
      {#each messages as message (message.id)}
        <div class={message.role === 'user' ? 'user-message' : 'assistant-message'}>
          {#if message.role === 'user'}
            <div class="user-bubble">{message.content}</div>
          {:else}
            <div class="assistant-copy markdown-body">{@html markdownToHtml(message.content)}</div>
          {/if}
        </div>
      {/each}

      {#if streamingReply || isThinking}
        <div class="assistant-message">
          {#if streamingReply}
            <div class="assistant-copy markdown-body">{@html renderedStreamingReply}</div>
          {:else}
            <div class="assistant-loading">
              <div class="thinking-dots" aria-label="AI is responding">
                <span></span>
                <span></span>
                <span></span>
              </div>
              {#if progressText}
                <span class="progress-text">{progressText}</span>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <div class="greeting">What can I help with?</div>
  {/if}

  <div class="input-container">
    <div class={hasMessages ? 'chat-input-wrapper' : 'input-wrapper'}>
      <Input
        bind:promptInput
        onSend={sendPrompt}
        disabled={isThinking || !$currentModel}
      />
    </div>
  </div>
</section>

<style>
  .chat-area {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 20px 20px;
    position: relative;
  }

  .greeting {
    font-family: 'Sohne Buch', -apple-system, system-ui, sans-serif;
    font-size: 28px;
    font-weight: lighter;
    letter-spacing: 0.02em;
    color: #ececec;
    text-align: center;
    margin-bottom: 64px;
    font-synthesis: none;
  }

  .chat-messages {
    width: 100%;
    max-width: 768px;
    margin: 0 auto;
    padding: 20px 16px 120px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .chat-messages::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  .user-message {
    display: flex;
    justify-content: flex-end;
  }

  .assistant-message {
    display: flex;
    justify-content: flex-start;
  }

  .user-bubble {
    background-color: #2f2f2f;
    color: #f2fff2;
    padding: 12px 20px;
    border-radius: 25px;
    display: inline-block;
    max-width: 70%;
    font-family: sans-serif;
    white-space: pre-wrap;
  }

  .assistant-copy {
    background-color: transparent;
    color: #ffffff;
    padding: 12px 0;
    display: block;
    max-width: 100%;
    font-family: sans-serif;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .markdown-body {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .markdown-body :global(p),
  .markdown-body :global(ul),
  .markdown-body :global(ol),
  .markdown-body :global(blockquote),
  .markdown-body :global(pre),
  .markdown-body :global(table) {
    margin: 0 0 12px;
  }

  .markdown-body :global(p:last-child),
  .markdown-body :global(ul:last-child),
  .markdown-body :global(ol:last-child),
  .markdown-body :global(blockquote:last-child),
  .markdown-body :global(pre:last-child),
  .markdown-body :global(table:last-child) {
    margin-bottom: 0;
  }

  .markdown-body :global(h1),
  .markdown-body :global(h2),
  .markdown-body :global(h3),
  .markdown-body :global(h4),
  .markdown-body :global(h5),
  .markdown-body :global(h6) {
    margin: 0 0 12px;
    line-height: 1.35;
    font-weight: 700;
  }

  .markdown-body :global(h1) {
    font-size: 1.5em;
  }

  .markdown-body :global(h2) {
    font-size: 1.35em;
  }

  .markdown-body :global(h3) {
    font-size: 1.2em;
  }

  .markdown-body :global(h4),
  .markdown-body :global(h5),
  .markdown-body :global(h6) {
    font-size: 1.05em;
  }

  .markdown-body :global(ul),
  .markdown-body :global(ol) {
    padding-left: 24px;
  }

  .markdown-body :global(li + li) {
    margin-top: 4px;
  }

  .markdown-body :global(blockquote) {
    padding-left: 12px;
    border-left: 2px solid #4a4a4a;
    color: #d0d0d0;
  }

  .markdown-body :global(pre) {
    overflow-x: auto;
    padding: 12px;
    background-color: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .markdown-body :global(pre::-webkit-scrollbar) {
    width: 0;
    height: 0;
    display: none;
  }

  .markdown-body :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    background-color: rgba(255, 255, 255, 0.06);
    padding: 0.1em 0.3em;
    border-radius: 6px;
  }

  .markdown-body :global(pre code) {
    white-space: pre;
    background-color: transparent;
    padding: 0;
  }

  .markdown-body :global(a) {
    color: inherit;
    text-decoration: underline;
  }

  .markdown-body :global(img) {
    max-width: 100%;
    height: auto;
  }

  .markdown-body :global(table) {
    border-collapse: collapse;
    display: block;
    overflow-x: auto;
    max-width: 100%;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .markdown-body :global(table::-webkit-scrollbar) {
    width: 0;
    height: 0;
    display: none;
  }

  .markdown-body :global(th),
  .markdown-body :global(td) {
    border: 1px solid #4a4a4a;
    padding: 6px 10px;
    text-align: left;
  }

  .markdown-body :global(input[type='checkbox']) {
    accent-color: #ececec;
    vertical-align: middle;
  }

  .assistant-loading {
    color: #ffffff;
    padding: 12px 0;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 32px;
  }

  .thinking-dots {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .thinking-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #b4b4b4;
    animation: bounce 1s infinite ease-in-out;
  }

  .thinking-dots span:nth-child(2) {
    animation-delay: 0.15s;
  }

  .thinking-dots span:nth-child(3) {
    animation-delay: 0.3s;
  }

  .progress-text {
    color: #8e8e8e;
    font-size: 13px;
  }

  .input-container {
    width: 100%;
    max-width: 768px;
    box-sizing: border-box;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    background-color: #2f2f2f;
    border-radius: 9999px;
    padding: 8px 16px;
    gap: 12px;
    box-shadow: 0 0 15px rgba(0,0,0,0.1);
  }

  .chat-input-wrapper {
    display: flex;
    width: 100%;
    background-color: #2f2f2f;
    border-radius: 9999px;
    padding: 8px 16px;
    gap: 12px;
    box-shadow: 0 0 15px rgba(0,0,0,0.1);
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: translateY(0);
      opacity: 0.45;
    }

    40% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    .chat-area {
      padding: 0 16px 16px;
    }

    .greeting {
      font-size: 24px;
    }

    .input-wrapper,
    .chat-input-wrapper {
      padding: 6px 12px;
    }
  }
</style>
