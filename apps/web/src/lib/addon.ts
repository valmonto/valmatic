import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { RouteObject } from 'react-router';

/** A link an add-on puts in the sidebar and the command menu. */
export interface AddonLink {
  titleKey: string;
  url: string;
  icon: LucideIcon;
  /** The sidebar group it goes in. Default: Developer. Platform: admins only. */
  group?: 'management' | 'developer' | 'platform';
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
  /** Controls in the top bar, beside search (e.g. an organization switcher). */
  headerItems?: ComponentType[];
}
