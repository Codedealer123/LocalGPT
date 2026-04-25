<script>
  import { onMount } from 'svelte';
  import Sidebar from './lib/Sidebar.svelte';
  import ModelSelector from './lib/ModelSelector.svelte';
  import Chat from './lib/Chat.svelte';
  import Icon from './lib/Icon.svelte';

  import { selectedChatId } from './lib/js/store.js';

  let isSidebarOpen = true;

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) isSidebarOpen = false;
  }

  onMount(() => {
    isSidebarOpen = window.innerWidth > 768;
  });
</script>

<a class="skip-link" href="#main-content">Skip to content</a>

<div class="app-container">
  <Sidebar
    isOpen={isSidebarOpen}
    toggleSidebar={toggleSidebar}
    closeSidebarOnMobile={closeSidebarOnMobile}
    selectedChat={$selectedChatId}
  />

  <main id="main-content" class="main-content">
    <header class="top-nav">
      <div class="left-nav-group">

        {#if !isSidebarOpen}
          <button type="button" class="icon-btn" on:click={toggleSidebar} aria-label="Open sidebar">
            <Icon name="toggleSidebar" width="24" height="24" />
          </button>
        {/if}

        <ModelSelector />
      </div>
    </header>

    <Chat />
  </main>
</div>
