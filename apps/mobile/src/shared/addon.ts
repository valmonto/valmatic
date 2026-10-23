import type { ComponentProps, ComponentType, ReactNode } from 'react';
import type { Href, Tabs } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';

/** What expo-router hands a custom tab bar. */
export type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * What an add-on brings to the app (docs/addons.md). Each add-on's
 * `index.ts` exports one as `addon`; `addons.generated.ts` lists those the
 * project keeps. Its route files live in `src/app` with `// addon:<name>` as
 * their first line, so `pnpm valmatic:sync` can remove them with it.
 */
export interface MobileAddon {
  /** Tabs between the core Home and Profile; each needs a route file in `(tabs)`. */
  tabs?: { name: string; titleKey: string; icon: LucideIcon }[];
  /** Stack screens outside the tabs; each needs a route file in `src/app`. */
  screens?: { name: string; modal?: boolean }[];
  /** Entries on the Profile screen that open the add-on's pages. */
  links?: { titleKey: string; descriptionKey?: string; href: Href; icon: LucideIcon }[];
  /** Replaces the core tab bar. At most one add-on should. */
  tabBar?: (props: TabBarProps) => ReactNode;
  /** Replaces the core Home screen. At most one add-on should. */
  homeScreen?: ComponentType;
}
