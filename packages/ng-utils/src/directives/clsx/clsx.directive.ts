import { Directive, Input, ElementRef, OnChanges } from '@angular/core';
import clsx, { ClassValue } from 'clsx';

/**
 *  Directive for module clsx.
 *
 *  @see https://www.npmjs.com/package/clsx.
 */
@Directive({
  selector: '[clsx]',
})
export class ClsxDirective implements OnChanges {
  @Input('clsx') public clsx: ClassValue[];

  /** Initial component / tag classes */
  private _initialClasses = '';

  /** Necessary in order not to duplicate classes after theme changes */
  private _prevClasses: string;

  public constructor(
    private elRef: ElementRef,
  ) { }

  public ngOnChanges(): void {
    this.renderClasses();
  }

  /** Converts input value into classes and attaches to element */
  private renderClasses(): void {
    const classes = clsx(this.clsx);

    this._initialClasses = this.elRef.nativeElement.className;

    if (this._prevClasses && this._initialClasses) {
      const prev = this._prevClasses.split(' ');
      prev.forEach((item) => { this._initialClasses = this._initialClasses.replace(item, '').replace(/\s+/gi, ' ').trim(); });
    }

    this.elRef.nativeElement.className = `${this._initialClasses} ${classes}`;
    this._prevClasses = classes;
  }
}
