<script>
  import { onMount, tick } from 'svelte';
  import { availableModels, currentModel } from './js/store.js';
  import { formatModelName, getModelHint } from './js/format.js';
  import Icon from './Icon.svelte';
  import * as bootstrap from 'bootstrap';

  export let selectedModel = null;

  let dropdownOpen = false;
  let filterText = "";
  let tooltipInstances = [];

  // 🔥 SINGLE SOURCE OF TRUTH FOR LABELS
  /**
   * @param {{ model_id?: string } | string | null} model
   */
  const getModelId = (model) =>
    typeof model === "string" ? model : model?.model_id ?? "";

  const getLabel = (model) =>
    formatModelName(getModelId(model));

  $: filteredModels = ($availableModels ?? []).filter((model) => {
    const label = getLabel(model).toLowerCase();
    const query = filterText.toLowerCase();

    return !query || label.includes(query);
  });

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function selectModel(model) {
    selectedModel = model;
    currentModel.set(model.model_id);
    localStorage.setItem("currentModel", model.model_id);
    dropdownOpen = false;
    filterText = "";
  }

  function initTooltips() {
    // cleanup old instances
    tooltipInstances.forEach(t => t.dispose());
    tooltipInstances = [];

    document
      .querySelectorAll('[data-bs-toggle="tooltip"]')
      .forEach((el) => {
        const existing = bootstrap.Tooltip.getInstance(el);
        if (existing) existing.dispose();

        tooltipInstances.push(new bootstrap.Tooltip(el));
      });
  }

  // init once
  onMount(() => {
    initTooltips();
  });

  // re-init when dropdown opens AFTER DOM updates
  $: if (dropdownOpen) {
    tick().then(initTooltips);
  }

  function setModelSelector(model) {
    return getLabel(model) || "No Model Selected";
  }
</script>

<div class="model-selector-wrapper" on:click|stopPropagation>
  <button class="model-selector" on:click={toggleDropdown}>
    {setModelSelector(selectedModel)}
    <Icon name="dropdown" width="16" height="16"/>
  </button>

  <div class="model-dropdown" class:open={dropdownOpen}>
    <div class="model-search-wrapper">
      <input
        type="search"
        class="model-search"
        placeholder="Filter models..."
        bind:value={filterText}
      />
    </div>

    {#if filteredModels.length}
      <div class="model-options-list">
        {#each filteredModels as model}
          <button
            type="button"
            class="model-option"
            on:click={() => selectModel(model)}
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title={getModelHint(model.model_id)}
          >
            {getLabel(model)}
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty-state">No models found</div>
    {/if}
  </div>
</div>

<style>
  .model-selector-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .model-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: #ececec;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    padding: 8px 10px;
    border-radius: 8px;
  }

  .model-selector:hover {
    background-color: #2f2f2f;
  }

  .model-dropdown {
    position: absolute;
    top: 42px;
    left: 0;
    background: #353535;
    border-radius: 10px;
    min-width: 260px;
    max-height: 320px;
    display: none;
    flex-direction: column;
    z-index: 999;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    overflow: hidden;
  }

  .model-dropdown.open {
    display: flex;
  }

  .model-search-wrapper {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .model-search {
    width: 100%;
    padding: 9px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #2d2d2d;
    color: #ececec;
    font-size: 13px;
    outline: none;
  }

  .model-options-list {
    max-height: 256px;
    overflow-y: auto;

    /* hide scrollbar */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .model-options-list::-webkit-scrollbar {
    display: none;
  }

  .model-option {
    background: transparent;
    border: none;
    color: #ececec;
    text-align: left;
    padding: 10px 12px;
    cursor: pointer;
    font-size: 13px;
    width: 100%;
  }

  .model-option:hover {
    background: #2f2f2f;
  }

  .empty-state {
    padding: 14px 12px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
  }
</style>
