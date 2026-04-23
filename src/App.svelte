<script>
  import { onDestroy } from 'svelte';
  import Sidebar from './lib/Sidebar.svelte';
  import { subscribeMessageCount } from './lib/js/chats.js';
  import { selectedChatId, currentModel } from './lib/js/store.js';
  import ModelSelector from './lib/ModelSelector.svelte';
  import Chat from './lib/Chat.svelte'
  import Icon from './lib/Icon.svelte'

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', reg);

        await navigator.serviceWorker.ready;
        console.log('SW ready');
      } catch (err) {
        console.error('SW failed:', err);
      }
    });
  }

  let isSidebarOpen = true;
  let messageCount = 0;

  const unsubscribeMessageCount = subscribeMessageCount((count) => {
    messageCount = count;
  });

  const unsubscribeSelectedChat = selectedChatId.subscribe(id => {
    if (id) {
      sessionStorage.setItem('selectedChatId', id);
    } else {
      sessionStorage.removeItem('selectedChatId');
    }
  });

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
      isSidebarOpen = false;
    }
  }

  onDestroy(() => {
    unsubscribeMessageCount();
    unsubscribeSelectedChat();
  });
</script>

<div class="app-container">
  <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeSidebarOnMobile={closeSidebarOnMobile} selectedChat={$selectedChatId} />

  <main class="main-content">
    <header class="top-nav">
      <div class="left-nav-group">
        {#if !isSidebarOpen}
          <button class="icon-btn sidebar-toggle-btn" on:click={toggleSidebar} aria-label="Open sidebar">
            <Icon name="toggleSidebar" width="24" height="24" />
          </button>
        {/if}

        <ModelSelector selectedModel={$currentModel}></ModelSelector>
      </div>
    </header>

    <Chat />
  </main>
</div>
