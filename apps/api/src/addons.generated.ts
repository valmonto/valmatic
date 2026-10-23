// Written by `pnpm valmatic:sync` from valmatic.json. Do not edit.
import type { DynamicModule, Type } from '@nestjs/common';
import { addonModule as demo } from './addons/demo/index.js';

export const addonModules: Array<Type<unknown> | DynamicModule> = [demo];
