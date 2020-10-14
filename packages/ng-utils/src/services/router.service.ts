import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationExtras, Params, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

/** Service which provides small useful reusable functions (methods) */
// @Injectable({ providedIn: 'root' })
@Injectable()
export class RouterService {
  private _routeParams$: Observable<Params>;
  private _routeParamsSubscription: Subscription;
  private _routeParams: Params;

  public constructor(
    private router: Router,
    private location: Location,
  ) { this.subscribeRouteParams(); }

  /** Getter for params$ observalbe */
  public get routeParams$(): Observable<Params> { return this._routeParams$; }

  /** Getter for current route params */
  public get routeParams(): Params { return this._routeParams; }

  /** Gets current route title */
  public get currentRoute(): string | number {
    const route = decodeURIComponent(this.router.url.replace(/\/.*\//gi, ''));
    return Number.isNaN(+route) ? route : +route;
  }

  /** Gets current route parent title */
  public get parentRoute(): string {
    if (!this.router.url.match(/\/.*\//) || !this.router.url.match(/\/.*\//)[0]) return;
    return decodeURIComponent(this.router.url.match(/\/.*\//)[0].replace(/\/$/, ''));
  }

  /** Gets current full route */
  public getFullCurrentRoute = (includeHash = false): string => this.location.path(includeHash);

  /**
   *  Navigates to provided route
   *
   *  @param route - Route to navigate to
   */
  public goTo = (route: string, options?: NavigationExtras): Promise<boolean> => this.router.navigate([route], options);

  /**
   *  Navigates to page/ which is next to current route
   *
   *  @param route - Route to navigate to
   */
  public routerLink = (route: string, options?: NavigationExtras): Promise<boolean> => this
    .goTo(`${this.getFullCurrentRoute()}/${route}`, options);

  /** Navigates to previous page from router history */
  public back = (steps = 1): Promise<boolean> => {
    // if (steps <= 1) return this.router.navigate([this.parentRoute()]);
    if (steps <= 1) {
      this.location.back();
      return Promise.resolve(true);
    }
    return this.router.navigate([this.parentRoute]).then(() => this.back(steps - 1));
  };

  /** Go forward in histroy */
  public forward = (): void => this.location.forward();
  /* eslint-enable no-param-reassign */

  public unsubscribeRouteParams(): void {
    if (this._routeParamsSubscription) this._routeParamsSubscription.unsubscribe();
  }

  private getRoute(route: ActivatedRoute): ActivatedRoute {
    if (route === null) return null;
    /* eslint-disable-next-line */
    while (route.firstChild) route = route.firstChild;
    return route;
  }

  private subscribeRouteParams(): void {
    this._routeParams$ = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.getRoute(this.router.routerState.root).snapshot.params),
    );

    this._routeParamsSubscription = this._routeParams$.subscribe((params) => { this._routeParams = params; });
  }
}
