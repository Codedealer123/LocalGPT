<script>
  import Sidebar from './lib/Sidebar.svelte';
  import ModelSelector from './lib/ModelSelector.svelte';
  import Chat from './lib/Chat.svelte';
  import Icon from './lib/Icon.svelte';

  import { selectedChatId, currentModel } from './lib/js/store.js';

  let isSidebarOpen = true;

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) isSidebarOpen = false;
  }
</script>

<div class="app-container">
  <Sidebar
    isOpen={isSidebarOpen}
    toggleSidebar={toggleSidebar}
    closeSidebarOnMobile={closeSidebarOnMobile}
    selectedChat={$selectedChatId}
  />

  <main class="main-content">
    <header class="top-nav">
      <div class="left-nav-group">

        {#if !isSidebarOpen}
          <button class="icon-btn" on:click={toggleSidebar}>
            <Icon name="toggleSidebar" width="24" height="24" />
          </button>
        {/if}

        <ModelSelector />
      </div>
    </header>

    <Chat />
  </main>
</div>