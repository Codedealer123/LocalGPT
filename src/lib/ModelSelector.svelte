<script>
  import { onDestroy, tick } from 'svelte';
  import VirtualList from '@sveltejs/svelte-virtual-list';
  import { availableModels, currentModel } from './js/store.js';
  import { formatModelName, getModelHint } from './js/format.js';
  import { isModelRecommended } from './js/recommendModels.js';
  import Icon from './Icon.svelte';
  import * as bootstrap from 'bootstrap';

  export let selectedModel = null;

  let dropdownOpen = false;
  let filterText = "";
  let tooltipInstances = [];
  let activeIndex = -1;
  let optionRefs = [];

  const listboxId = "model-selector-listbox";
  const modelRowHeight = 40;

  /**
   * @param {{ model_id?: string } | string | null} model
   */
  const getModelId = (model) =>
    typeof model === "string" ? model : model?.model_id ?? "";

  const getLabel = (model) =>
    formatModelName(getModelId(model));

  function isRecommendedModel(model) {
    return isModelRecommended(model?.model_id ?? "");
  }

  $: baseModels = $availableModels ?? [];
  $: normalizedFilter = filterText.trim().toLowerCase();

  $: recommendedModelIds = new Set(
    baseModels.filter((model) => isRecommendedModel(model)).map((model) => getModelId(model))
  );

  $: filteredModels = baseModels.filter((model) => {
    const label = getLabel(model).toLowerCase();
    const modelId = getModelId(model).toLowerCase();

    return !normalizedFilter || label.includes(normalizedFilter) || modelId.includes(normalizedFilter);
  });

  $: visibleModels = [...filteredModels].sort((left, right) => {
    const leftRecommended = recommendedModelIds.has(getModelId(left));
    const rightRecommended = recommendedModelIds.has(getModelId(right));

    if (leftRecommended === rightRecommended) return 0;
    return leftRecommended ? -1 : 1;
  });

  $: visibleModelEntries = visibleModels.map((model, index) => ({ model, index }));
  $: selectedModelId = getModelId(selectedModel);
  $: selectedModelLabel = setModelSelector(selectedModel);

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
    activeIndex = dropdownOpen && visibleModels.length ? 0 : -1;
  }

  function closeDropdown() {
    dropdownOpen = false;
    activeIndex = -1;
  }

  function selectModel(model) {
    selectedModel = model;
    currentModel.set(model.model_id);
    localStorage.setItem("currentModel", model.model_id);
    closeDropdown();
    filterText = "";
  }

  function handleKeydown(event) {
    if ((event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") && !dropdownOpen) {
      event.preventDefault();
      dropdownOpen = true;
      activeIndex = visibleModels.length ? 0 : -1;
      return;
    }

    if (!dropdownOpen || !visibleModels.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % visibleModels.length;
      scrollIntoView();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + visibleModels.length) % visibleModels.length;
      scrollIntoView();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const model = visibleModels[activeIndex];
      if (model) selectModel(model);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
    }
  }

  function scrollIntoView() {
    tick().then(() => {
      optionRefs[activeIndex]?.scrollIntoView({ block: "nearest" });
    });
  }

  function initTooltips() {
    tooltipInstances.forEach((tooltip) => tooltip.dispose());
    tooltipInstances = [];

    document
      .querySelectorAll('[data-bs-toggle="tooltip"]')
      .forEach((element) => {
        const existing = bootstrap.Tooltip.getInstance(element);
        if (existing) existing.dispose();

        tooltipInstances.push(
          new bootstrap.Tooltip(element, {
            offset: [0, 8],
            customClass: 'custom-tooltip'
          })
        );
      });
  }

  function setModelSelector(model) {
    const label = getLabel(model);
    return label || "No Model Selected";
  }

  $: if (dropdownOpen) {
    tick().then(initTooltips);
  }

  $: if (dropdownOpen && activeIndex >= visibleModels.length) {
    activeIndex = visibleModels.length ? visibleModels.length - 1 : -1;
  }

  onDestroy(() => {
    tooltipInstances.forEach((tooltip) => tooltip.dispose());
  });
</script>

<div class="model-selector-wrapper">
  <button
    class="model-selector-trigger"
    type="button"
    aria-label="Select model"
    aria-expanded={dropdownOpen}
    aria-controls={listboxId}
    aria-haspopup="listbox"
    on:click={toggleDropdown}
    on:keydown={handleKeydown}
  >
    <span class="model-selector-label">{selectedModelLabel}</span>
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

    {#if visibleModelEntries.length}
      <div class="model-options-list" id={listboxId} role="listbox" aria-label="Available models">
        <VirtualList items={visibleModelEntries} height="256px" itemHeight={modelRowHeight} let:item>
          <button
            bind:this={optionRefs[item.index]}
            id={`model-option-${item.index}`}
            type="button"
            role="option"
            class="model-option"
            class:active={item.index === activeIndex}
            class:selected={getModelId(item.model) === selectedModelId}
            aria-selected={getModelId(item.model) === selectedModelId}
            on:click={() => selectModel(item.model)}
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title={getModelHint(item.model.model_id)}
          >
            {getLabel(item.model)}
          </button>
        </VirtualList>
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

  .model-selector-trigger {
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
    min-width: 0;
  }

  .model-selector-trigger:hover,
  .model-selector-trigger:focus-visible {
    background-color: #2f2f2f;
    outline: none;
  }

  .model-selector-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 320px;
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
    overflow: hidden;
  }

  .model-options-list :global(svelte-virtual-list-viewport) {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .model-options-list :global(svelte-virtual-list-viewport::-webkit-scrollbar) {
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
    height: 40px;
  }

  .model-option:hover,
  .model-option.active,
  .model-option.selected {
    background: #2f2f2f;
  }

  .empty-state {
    padding: 14px 12px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
  }

  :global(.custom-tooltip .tooltip-inner) {
    background: #2d2d2d;
    color: #ececec;
    font-size: 12px;
    border-radius: 6px;
    padding: 6px 8px;
  }

  :global(.custom-tooltip.bs-tooltip-end .tooltip-arrow::before) {
    border-right-color: #2d2d2d;
  }
</style>
