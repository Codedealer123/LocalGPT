<script>
    export let name;
    export let label = "";
    export let classes = "";
    export let width = "24";
    export let height = "24";
    
</script>

<svg class={classes} aria-label={label} width={width} height={height}>
    <use href={`/icons.svg#${name}`}></use>
</svg>