<script>
    import Icon from './Icon.svelte'
    
    export let promptInput = "";
    export let onSend = () => {};
    export let disabled = false;
</script>

<input
  type="text"
  placeholder="Ask anything"
  class="prompt-input"
  bind:value={promptInput}
  disabled={disabled}
  on:keydown={(event) => event.key === 'Enter' && !disabled && onSend()}
/>
  
<div class="right-actions">
  <button class="icon-btn solid-btn" aria-label="Send message" on:click={onSend} disabled={disabled}>
    <Icon name="send" width="18" height="18" />
  </button>
</div>

<style>
    @font-face {
      font-family: 'Sohne Buch';
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: url('./fonts/SohneBuch.otf') format('opentype');
    }
    
    .prompt-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #ececec;
      font-size: 16px;
      padding: 12px;
      outline: none;
      min-width: 0;
    }
    
    .prompt-input::placeholder {
      color: #8e8e8e;
    }

    .prompt-input:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .right-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: #b4b4b4;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s, color 0.2s;
    }
    
    .icon-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #ececec;
    }
    
    .solid-btn {
      background-color: #ececec;
      color: #212121;
      padding: 6px;
    }
    
    .solid-btn:hover {
      background-color: #ffffff;
      color: #212121;
    }

    .icon-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
</style>
