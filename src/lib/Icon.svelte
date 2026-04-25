<script>
    export let name;
    export let label = "";
    export let classes = "";
    export let width = "24";
    export let height = "24";
    $: isDecorative = !label;
</script>

<svg
    class={classes}
    aria-label={label || undefined}
    aria-hidden={isDecorative}
    focusable="false"
    width={width}
    height={height}
>
    <use href={`/icons.svg#${name}`}></use>
</svg>
