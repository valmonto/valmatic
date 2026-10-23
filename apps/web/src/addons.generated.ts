// Written by `pnpm valmatic:sync` from valmatic.json. Do not edit.
import type { Addon } from '@/lib/addon';
import { addon as demo } from './addons/demo';
import { addon as organizations } from './addons/organizations';

export const addons: Addon[] = [demo, organizations];
