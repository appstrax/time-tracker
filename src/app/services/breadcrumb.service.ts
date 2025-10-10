import { filter } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NavigationEnd, Route, Router } from '@angular/router';

export interface IBreadcrumb {
  label: string;
  url: string;
}

class RouteConfig {
  path: string;
  url: string[];
  label: string;

  constructor(route: Route) {
    this.path = route.path ?? '';
    this.url = route.path?.split('/').filter((x) => x) ?? [];
    this.label = route.data?.['breadcrumb'] ?? '';
  }

  matchesUrl(url: string[]): boolean {
    if (url.length !== this.url.length) return false;

    for (let i = 0; i < url.length; i++) {
      if (this.url[i].includes(':')) continue;
      if (url[i] !== this.url[i]) return false;
    }

    return true;
  }

  toBreadcrumb(): IBreadcrumb {
    return {
      label: this.label,
      url: this.path,
    };
  }
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<IBreadcrumb[]>([]);
  private breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  private routes: RouteConfig[] = [];

  constructor(private router: Router) {
    const routes =
      this.router.config.find((x) => {
        return x.path === '' && x.children?.length;
      })?.children ?? [];
    this.routes = routes.map((x) => new RouteConfig(x));

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const breadcrumbs = this.getUrlBreadcrumbs(event.url);
        this.breadcrumbsSubject.next(breadcrumbs);
      });
  }

  private getUrlBreadcrumbs(path: string): IBreadcrumb[] {
    const url = path.split('/').filter((x) => x);
    const breadcrumbs: IBreadcrumb[] = [];
    while (url.length) {
      const route = this.routes.find((x) => x.matchesUrl(url));
      if (route) breadcrumbs.push(route.toBreadcrumb());
      url.pop();
    }
    return breadcrumbs.reverse();
  }

  public subscribe(
    callback: (breadcrumbs: IBreadcrumb[]) => void
  ): Subscription {
    return this.breadcrumbs$.subscribe(callback);
  }
}
