import { getBoolean, getInt, getBooleanOrInt } from '../utils/helpers';

export class AnimatedSvg {
	protected _defaultConfig: IAnimatedSvgConfig = {
		enabled: true,
		duration: 2000,
		oneByOne: false,
		delay: 0,
		timingFunction: 'ease-in-out',
		loop: false,
		loopDelay: 500,
		stroke: '#000000',
		strokeWidth: 1,
	};

	protected updateTimer: any;
	protected prevProps: any;
	protected animationTimers: any = { };
	protected animationDataAttribute = 'data-svg-animation-end';

	protected props: IExternalAnimatedSvgConfig;
	protected container: HTMLElement;

	constructor(
		protected dispatch?: Dispatch,
	) { }

	public enable(container: HTMLElement, props: IExternalAnimatedSvgConfig): void {
		if (this.updateTimer) { clearTimeout(this.updateTimer); }

		this.container = container;
		this.props = { enabled: true, ...props };

    this.updateSvgs(container);
	}

	public disable(): void {
		Object.keys(this.animationTimers).forEach((key) => clearTimeout(this.animationTimers[key]));
		this.animationTimers = { };
		if (this.container) this.svgs(this.container).forEach((item) => item.removeAttribute(this.animationDataAttribute));
		this.props.enabled = false;
	}

	protected updateSvgs(container: HTMLElement): void {
		this.svgs(container).forEach((item, i) => {
			this.applySvgConfig(item);
			this.execAnimation(item, i);
		});
	}

	protected applySvgConfig(svg: SVGSVGElement): void {
		if (!svg) return;
		const { width } = window.getComputedStyle(svg);
		const viewBox = svg.getAttribute('viewBox');

		const customWidth = this.defaultConfig(this.props).width;

		let cWidth = getInt(width);
		if (!cWidth || cWidth === 0) cWidth = getInt(viewBox.split(' ')[2]);
		if ((!cWidth || cWidth === 0) && customWidth) cWidth = customWidth;

		/* eslint-disable-next-line no-param-reassign */
		svg.style.width = cWidth ? `${cWidth}px` : 'auto';
	}

	protected execAnimation(svg: SVGSVGElement, i: number): number {
		if (!svg) return;
		const { duration, loopDelay, loop, enabled } = this.defaultConfig(this.props);

		const list = Array.from(svg.querySelectorAll('path'));
		list.forEach((item) => { this.applySvgPathBasicStyles(item, this.props); });

		if (!enabled || (svg.hasAttribute(this.animationDataAttribute) && !loop)) return;
		else if (svg.hasAttribute(this.animationDataAttribute)) {
			const timeout = getInt(svg.getAttribute(this.animationDataAttribute)) - Date.now() + 1;
			this.setTimer(i, timeout + loopDelay, () => this.execAnimation(svg, i));
			return;
		}

		const latestAnimationDuration = this.calculateAnimationDuration(list.length - 1, this.props);
		const stopTimestamp = Date.now() + latestAnimationDuration;

		svg.setAttribute(this.animationDataAttribute, `${stopTimestamp}`);
		setTimeout(() => svg.removeAttribute(this.animationDataAttribute), latestAnimationDuration);

		list.forEach((item: SVGPathElement, i) => { this.animateSvgPath(item, i, this.props); });

		if (this.dispatch) this.dispatch({ latestAnimationDuration });

		if (loop) {
			const loopDuration = Math.max(typeof loop === 'number' ? loop : duration, latestAnimationDuration);
			this.setTimer(i, loopDuration + loopDelay, () => this.execAnimation(svg, i));
		}

		return latestAnimationDuration;
	}

	protected setTimer(i: number, timeout: number, cb: Function): void {
		this.animationTimers[i] = setTimeout(() => { cb(); }, timeout);
	}

	protected calculateAnimationDuration(length: number, props: IExternalAnimatedSvgConfig): number {
		const { duration, delay, oneByOne } = this.defaultConfig(props);

		let latestAnimationDuration = duration;
		const animDelay = length === 0 ? 0 : delay * length || 0;
		if (oneByOne) latestAnimationDuration = duration * length + animDelay + duration;

		return latestAnimationDuration;
	}

	protected applySvgPathBasicStyles(item: SVGPathElement, props: IExternalAnimatedSvgConfig): void {
		const { stroke, strokeWidth } = this.defaultConfig(props);

		const { stroke: oStroke, strokeWidth: oStrokeWidth } = window.getComputedStyle(item);

		if (!oStroke || oStroke === 'none') item.style.stroke = this._defaultConfig.stroke;
		if (stroke) item.style.stroke = stroke;

		if (!oStrokeWidth) item.style.strokeWidth = `${this._defaultConfig.strokeWidth}px`;
		if (strokeWidth) item.style.strokeWidth = `${strokeWidth}px`;

		item.style.fill = 'none';
	}

	protected animateSvgPath(item: SVGPathElement, i: number, props: IExternalAnimatedSvgConfig): number {
		const { duration, delay, timingFunction, oneByOne } = this.defaultConfig(props);

		let latestAnimationDuration = duration;
		const animDelay = i === 0 ? 0 : delay * i || 0;
		const length = item.getTotalLength();

		/* eslint-disable no-param-reassign */
		item.style.transition = 'none';
		item.style.strokeDasharray = `${length} ${length}`;
		item.style.strokeDashoffset = `${length}`;

		item.getBoundingClientRect(); // This one is necessary in order to apply styles above and init animation
		item.style.transitionProperty = 'stroke-dashoffset';
		item.style.transitionTimingFunction = timingFunction;
		item.style.transitionDuration = `${duration}ms`;
		if (oneByOne) {
			item.style.transitionDelay = `${duration * i + animDelay}ms`;
			latestAnimationDuration = duration * i + animDelay + duration;
		}
		item.style.strokeDashoffset = '0';
		/* eslint-enable no-param-reassign */

		return latestAnimationDuration;
	}

	protected defaultConfig(props: IExternalAnimatedSvgConfig): IAnimatedSvgConfig {
		const { enabled, duration, oneByOne, delay, timingFunction, loop, loopDelay, stroke, strokeWidth, width } = props;
		// console.log('this._defaultConfig >>>', this._defaultConfig);
		return {
			enabled: getBoolean(enabled ?? this._defaultConfig.enabled),
			duration: getInt(duration ?? this._defaultConfig.duration),
			oneByOne: getBoolean(oneByOne ?? this._defaultConfig.oneByOne),
			delay: getInt(delay ?? this._defaultConfig.delay),
			timingFunction: timingFunction ?? this._defaultConfig.timingFunction,
			loop: getBooleanOrInt(loop ?? this._defaultConfig.loop),
			loopDelay: getInt(loopDelay ?? this._defaultConfig.loopDelay),
			stroke: stroke,
			strokeWidth: getInt(strokeWidth),
			width: getInt(width ?? this._defaultConfig.width),
		};
	}

	protected svgs(container: HTMLElement): SVGSVGElement[] {
		return container ? Array.from(container.querySelectorAll('svg')) : [];
	}
}

export interface IAnimatedSvgConfig {
  /** Whether to run animation. Default = true. */
  enabled?: boolean;

  /** Animation duration in ms. Default = 2000. */
  duration?: number;

  /** Whether to animate paths oneByOne instead of simultaniously. Default = false */
  oneByOne?: boolean;

  /** Animation delay in ms for each path if oneByOne. Default = 0. */
  delay?: number;

  /** Animation timing-function. Default = `ease-in-out`. */
  timingFunction?: string;

  /** Whether to run animation in loop (or loop timeout in ms). Default = false. */
  loop?: boolean | number;

  /** Delay before starting next loop in ms. Default = 500. */
  loopDelay?: number;

  /** Path `stroke` attribute (It is necessary in order to run animation). Default = `#000000`. */
  stroke?: string;

  /** Path `stroke-width` attribute. Default = 1. */
  strokeWidth?: number;

  /** Svg `width` attribute. */
  width?: number;
}

export interface IExternalAnimatedSvgConfig {
  /** Whether to run animation. Default = true. */
  enabled?: boolean | string;

  /** Animation duration in ms. Default = 2000. */
  duration?: number | string;

  /** Whether to animate paths oneByOne instead of simultaniously. Default = false */
  oneByOne?: boolean | string;

  /** Animation delay in ms for each path if oneByOne. Default = 0. */
  delay?: number | string;

  /** Animation timing-function. Default = `ease-in-out`. */
  timingFunction?: string | string;

  /** Whether to run animation in loop (or loop timeout in ms). Default = false. */
  loop?: boolean | number | string;

  /** Delay before starting next loop in ms. Default = 500. */
  loopDelay?: number | string;

  /** Path `stroke` attribute (It is necessary in order to run animation). Default = `#000000`. */
  stroke?: string;

  /** Path `stroke-width` attribute. Default = 1. */
  strokeWidth?: number | string;

  /** Svg `width` attribute. */
  width?: number | string;
}

export type Dispatch = ({ latestAnimationDuration: number }) => any;
