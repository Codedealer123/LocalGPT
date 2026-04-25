<script>
  import { get } from 'svelte/store';
  import { chats, createChat, deleteChat, syncChats, setCurrentChatId } from './js/chats.js';
  import {
    twoLettersToColor,
    authReady,
    authUser,
    getUserAvatarText,
    getUserDisplayName,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  } from './js/auth.js';
  import { showAuthPrompt, showConfirm, showNotice, showPrompt } from './js/prompt.js';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
    import { AuthInvalidTokenResponseError } from '@supabase/supabase-js';

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

  async function handleProfileAction() {
    if (!$authReady) {
      return;
    }

    if (get(authUser)) {
      const confirmed = await showConfirm({
        title: 'Sign out?',
        message: `You are currently signed in as ${profileName}. Do you want to sign out now?`,
        confirmText: 'Sign out',
        cancelText: 'Stay signed in',
      });

      if (!confirmed) {
        return;
      }

      try {
        await signOut();
        closeSidebarOnMobile();
      } catch (error) {
        await showNotice({
          title: 'Could not sign out',
          message: error?.message ?? 'Something went wrong while signing out.',
        });
      }
      return;
    }

    const authInput = await showAuthPrompt();

    if (!authInput) {
      return;
    }

    try {
      if (authInput.mode === 'signup') {
        const signUpResult = await signUpWithPassword(authInput.name, authInput.email, authInput.password);

        if (signUpResult.needsEmailConfirmation) {
          await showNotice({
            title: 'Confirm your email',
            message: `Your account has been created for ${authInput.email}. Open your inbox and click the confirmation link before signing in. If you change this site URL later, make sure that new URL is also added to your Supabase Auth redirect settings.`,
            buttonText: 'Got it',
          });
        } else {
          await showNotice({
            title: 'Account created',
            message: `Welcome, ${authInput.name}. Your account is ready and you are already signed in.`,
            buttonText: 'Continue',
          });
        }
      } else {
        await signInWithPassword(authInput.email, authInput.password);
      }

      closeSidebarOnMobile();
    } catch (error) {
      await showNotice({
        title: 'Authentication failed',
        message: error?.message ?? 'We could not complete your sign-in request.',
      });
    }
  }

  $: profileName = getUserDisplayName($authUser);
  $: avatarText = getUserAvatarText($authUser);
  $: profileLabel = $authUser ? `Signed in as ${profileName}. Click to sign out.` : 'Sign in or sign up';

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
    <button
      type="button"
      class="user-profile"
      aria-label={profileLabel}
      title={profileLabel}
      on:click={handleProfileAction}
    >
      <div class="avatar" style={`background-color: ${twoLettersToColor(avatarText)}`}>{avatarText}</div>
      <span class="username">{profileName}</span>
    </button>
  </div>
</aside>
