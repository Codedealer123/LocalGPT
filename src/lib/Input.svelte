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
  aria-label="Message input"
  enterkeyhint="send"
  autocapitalize="sentences"
  autocomplete="off"
  disabled={disabled}
  on:keydown={(event) => event.key === 'Enter' && !disabled && onSend()}
/>
  
<div class="right-actions">
  <button type="button" class="icon-btn solid-btn" aria-label="Send message" on:click={onSend} disabled={disabled}>
    <Icon name="send" width="18" height="18" />
  </button>
</div>

<style>
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
    
    .prompt-input:focus {
        outline: none;
        border-color: inherit;
        box-shadow: none;
        -webkit-box-shadow: none;
    }
    
    .prompt-input::placeholder {
      color: #8e8e8e;
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

    .icon-btn:focus-visible,
    .prompt-input:focus-visible {
      outline: 2px solid rgba(236, 236, 236, 0.65);
      outline-offset: 2px;
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
