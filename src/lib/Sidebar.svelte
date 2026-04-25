<script>
  import { chats, createChat, deleteChat, syncChats, setCurrentChatId } from './js/chats.js';
  import { showPrompt } from './js/prompt.js';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  export let isOpen = true;
  export let toggleSidebar = () => {};
  export let closeSidebarOnMobile = () => {};
  export let selectedChat = null;

  function selectChat(id) {
    selectedChat = id;
    setCurrentChatId(id);
  }

  async function handleNewChat() {
    const chatTitle = await showPrompt({ message: "Enter chat title", placeholder: "New Chat" });
    if (chatTitle && chatTitle.trim() !== "") {
      const chatId = await createChat(chatTitle.trim());
      selectChat(chatId);
    }
  }

  onMount(() => {
    void syncChats();
  });
</script>

<button
  class="sidebar-backdrop {isOpen ? 'visible' : ''}"
  type="button"
  on:click={toggleSidebar}
  aria-label="Close sidebar"
  title="Close sidebar"
></button>

<aside class="sidebar {isOpen ? 'open' : 'closed'}">
  <div class="sidebar-top">
    <div class="top-actions">
      <button type="button" class="icon-btn" on:click={toggleSidebar} aria-label="Close sidebar">
        <Icon name="toggleSidebar" width="24" height="24" />
      </button>
      <button type="button" class="new-chat-btn" on:click={() => handleNewChat()}>
        <Icon name="pencil" width="20" height="20" />
        <span class="hide-on-mobile">New chat</span>
      </button>
    </div>
    <div class="chats-section">
      <span class="section-title">Your chats</span>
      <ul>
        {#each $chats as chat}
          <li class="chat-item {chat.id === selectedChat ? 'selected' : ''}" id={chat.id}>
            <button
              type="button"
              class="chat-select-btn"
              aria-current={chat.id === selectedChat ? 'page' : undefined}
              aria-label={`Open chat ${chat.title}`}
              on:click={() => selectChat(chat.id)}
            >
              <span class="chat-title">{chat.title}</span>
            </button>

            <button
              type="button"
              class="deleteBtn"
              aria-label={`Delete chat ${chat.title}`}
              on:click={() => deleteChat(chat.id)}
            >
              <Icon classes="deleteIcon" name="trashcan" width="24" height="24" />
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="sidebar-bottom">
    <button type="button" class="user-profile" on:click={closeSidebarOnMobile}>
      <div class="avatar">MU</div>
      <span class="username">Mukilan</span>
    </button>
  </div>
</aside>
