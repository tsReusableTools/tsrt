import { getBoolean, getInt } from '../utils/helpers';
import { AnimatedSvg, Dispatch, IAnimatedSvgConfig, IExternalAnimatedSvgConfig } from './AnimatedSvg';

export class SvgLoader extends AnimatedSvg {
	protected _defaultConfig: ISvgLoaderConfig = {
		...this._defaultConfig,

		shouldWaitAnimationEnd: true,
		backdrop: '#fffffffa',
		delayBeforeHide: 0,
		fadeOutDuration: 1000,
	};

	private _latestAnimationDuration: number;
	private _hideTimer: number;

	constructor(dispatch?: Dispatch) {
		super(dispatch);
	}

	public disable(): void {
		super.disable();
		this.hideBackdrop(this.props);
	}

	protected updateSvgs(container: HTMLElement): void {
		this.svgs(container).forEach((item, i) => {
			this.applySvgConfig(item);
			const latestAnimationDuration = this.execAnimation(item, i);
			if (latestAnimationDuration) this._latestAnimationDuration = latestAnimationDuration;
			this.applyContainerConfig(this.props);
		});
	}

  protected applyContainerConfig(props: IExternalSvgLoaderConfig): void {
		const { backdrop, enabled } = this.defaultConfig(props);

    this.container.style.background = backdrop;
		this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.display = 'flex';
    this.container.style.justifyContent = 'center';
    this.container.style.alignItems = 'center';
		this.container.style.alignContent = 'center';

		if (enabled && this._latestAnimationDuration) this.showBackdrop();
		if (!enabled && this._latestAnimationDuration) this.hideBackdrop(props);
	}

	protected showBackdrop(): void {
		if (this._hideTimer) clearTimeout(this._hideTimer);
		this.container.style.opacity = '1';
		this.container.style.zIndex = '1234567';
	}

	protected hideBackdrop(props: IExternalSvgLoaderConfig): void {
		const { shouldWaitAnimationEnd, delayBeforeHide, fadeOutDuration } = this.defaultConfig(props);
		this._hideTimer = setTimeout(() => {
			this.container.style.opacity = '0';
			this.container.style.zIndex = '-1';
			this.container.style.transition = `all ${fadeOutDuration}ms`;
		}, shouldWaitAnimationEnd ? this._latestAnimationDuration + delayBeforeHide : 0);
	}

  protected defaultConfig(props: IExternalSvgLoaderConfig): ISvgLoaderConfig {
    const { shouldWaitAnimationEnd = true, backdrop = '#fffffffa', delayBeforeHide = 0, fadeOutDuration = 1000 } = props;
    return {
			...super.defaultConfig(props),

      backdrop,
      shouldWaitAnimationEnd: getBoolean(shouldWaitAnimationEnd),
      delayBeforeHide: getInt(delayBeforeHide),
      fadeOutDuration: getInt(fadeOutDuration),
    };
  }
}

export interface ISvgLoaderConfig extends IAnimatedSvgConfig {
  /** Whether to wait for animation end before fade out. Default = true. */
  shouldWaitAnimationEnd?: boolean;

  /** Backdrop container background. Default = `#fffffffa`. */
  backdrop?: string;

  /** Delay after animation end and before fade out in ms. Default = 0. */
  delayBeforeHide?: number;

  /** Backdrop container fade out animation duration in ms. Default = 1000. */
  fadeOutDuration?: number;
}

export interface IExternalSvgLoaderConfig extends IExternalAnimatedSvgConfig {
  /** Whether to wait for animation end before fade out. Default = true. */
  shouldWaitAnimationEnd?: boolean | string;

  /** Backdrop container background. Default = `#fffffffa`. */
  backdrop?: string;

  /** Delay after animation end and before fade out in ms. Default = 0. */
  delayBeforeHide?: number | string;

  /** Backdrop container fade out animation duration in ms. Default = 1000. */
  fadeOutDuration?: number | string;
}
