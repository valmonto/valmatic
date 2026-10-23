// Written by `pnpm valmatic:sync` from valmatic.json. Do not edit.
import type { DynamicModule, Type } from '@nestjs/common';
import { addonModule as demo } from './addons/demo/index.js';
import { addonModule as organizations } from './addons/organizations/index.js';

export const addonModules: Array<Type<unknown> | DynamicModule> = [demo, organizations];
