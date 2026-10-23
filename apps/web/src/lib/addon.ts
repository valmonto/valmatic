import type { LucideIcon } from 'lucide-react';
import type { RouteObject } from 'react-router';

/** A link an add-on puts in the sidebar's Developer group and the command menu. */
export interface AddonLink {
  titleKey: string;
  url: string;
  icon: LucideIcon;
}

/**
 * What an add-on brings to the dashboard. Each add-on's `index.ts` exports
 * one as `addon`; `addons.generated.ts` lists those this project keeps
 * (valmatic.json, docs/addons.md). Core code reads only that list.
 */
export interface Addon {
  /** Routes outside the dashboard shell, owning the whole viewport. */
  rootRoutes?: RouteObject[];
  /** Routes inside the dashboard shell. */
  routes?: RouteObject[];
  links?: AddonLink[];
}
