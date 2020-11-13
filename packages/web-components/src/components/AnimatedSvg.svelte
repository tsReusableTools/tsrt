<svelte:options tag="animated-svg" immutable={true} />

<script lang="ts">
	import { createEventDispatcher, afterUpdate, onDestroy, onMount } from 'svelte';
  import { AnimatedSvg, IExternalAnimatedSvgConfig } from '../lib';

	export let enabled: boolean | string;
	export let duration: number | string;
	export let delay: number | string;
	export let onebyone: boolean | string;
	export let timingfunction: string;
	export let loop: boolean | number;
	export let loopdelay: number | string;
	export let stroke: string;
	export let strokewidth: number | string;
  export let width: number | string;

  const dispatch = createEventDispatcher();
  let container: HTMLElement;
  const animatedSvg = new AnimatedSvg(({ latestAnimationDuration }) => dispatch('animate', { latestAnimationDuration }));

  onMount(() => animatedSvg.enable(getContainer(), mapProps()));
  afterUpdate(() => animatedSvg.enable(getContainer(), mapProps()));
  onDestroy(() => animatedSvg.disable());

  function getContainer(): HTMLElement {
    return container && (container.parentNode as any).host
  }

  function mapProps(): IExternalAnimatedSvgConfig {
    return {
			enabled: enabled,
			duration: duration,
			oneByOne: onebyone,
			delay: delay,
			timingFunction: timingfunction,
			loop: loop,
			loopDelay: loopdelay,
			stroke: stroke,
			strokeWidth: strokewidth,
      width: width,
    }
  }
</script>

<div bind:this={container}><slot /></div>
