<script>
  import { get } from 'svelte/store';
  import { chats, createChat, deleteChat, syncChats, setCurrentChatId } from './js/chats.js';
  import { showConfirm, showNotice, showPrompt } from './js/prompt.js';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  export let isOpen = true;
  export let toggleSidebar = () => {};
  export let closeSidebarOnMobile = () => {};
  export let selectedChat = null;

  let username = localStorage.getItem('username') || '';

  function setUsername(name) {
    username = name;
    if (username) {
      localStorage.setItem('username', username);
    } else {
      localStorage.removeItem('username');
    }
  }

  function getInitials(name) {
    if (!name) return 'G';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function selectChat(id) {
    selectedChat = id;
    setCurrentChatId(id);
  }

  async function handleNewChat() {
    const chatTitle = await showPrompt({
      message: "Enter chat title",
      placeholder: "New Chat"
    });

    if (chatTitle && chatTitle.trim() !== "") {
      const chatId = await createChat(chatTitle.trim());
      selectChat(chatId);
    }
  }

  async function handleProfileAction() {
    if (!username) {
      const name = await showPrompt({
        message: "Pick a username",
        placeholder: "Your name"
      });

      if (name && name.trim()) {
        setUsername(name.trim());

        await showNotice({
          title: "Welcome",
          message: `Hey ${name.trim()}, you're all set.`,
          buttonText: "Ok"
        });
      }

      closeSidebarOnMobile();
      return;
    }

    const action = await showConfirm({
      title: "Profile",
      message: `You're signed in as ${username}. Want to change or clear it?`,
      confirmText: "Change name",
      cancelText: "Logout"
    });

    if (action) {
      const newName = await showPrompt({
        message: "Enter new username",
        placeholder: username
      });

      if (newName && newName.trim()) {
        setUsername(newName.trim());
      }
    } else {
      setUsername('');

      await showNotice({
        title: "Logged out",
        message: "Username removed from this device.",
        buttonText: "Ok"
      });
    }

    closeSidebarOnMobile();
  }

  $: profileName = username || 'Guest';
  $: avatarText = getInitials(username);
  $: profileLabel = username
    ? `Signed in as ${profileName}. Click to manage.`
    : 'Set your username';

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

      <button type="button" class="new-chat-btn" on:click={handleNewChat}>
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
              <Icon classes="deleteIcon" name="trashcan" width="20" height="20" />
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="sidebar-bottom">
    <button
      type="button"
      class="user-profile"
      aria-label={profileLabel}
      title={profileLabel}
      on:click={handleProfileAction}
    >
      <div class="avatar">
        {avatarText}
      </div>
      <span class="username">{profileName}</span>
    </button>
  </div>
</aside>