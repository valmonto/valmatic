import {
  Module,
  type DynamicModule,
  type InjectionToken,
  type ModuleMetadata,
  type OptionalFactoryDependency,
  type Provider,
} from '@nestjs/common';
import { AttachmentController } from './attachment.controller.js';
import { AttachmentRepository } from './attachment.repository.js';
import { AttachmentsService } from './attachments.service.js';
import { ATTACHMENT_SUBJECT_RESOLVERS } from './attachment.tokens.js';

import type { SubjectResolvers } from './attachment.tokens.js';

/** DI-built resolver map for subjects whose checks live in feature modules. */
export interface SubjectResolversFactory {
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  /** Same (...args: unknown[]) convention as the other forRootAsync modules —
   *  narrow the injected services inside the factory. */
  useFactory: (...args: unknown[]) => SubjectResolvers | Promise<SubjectResolvers>;
}

export interface AttachmentsModuleOptions {
  /** Modules whose exports the resolver factory needs (e.g. TasksModule). */
  imports?: ModuleMetadata['imports'];
  /**
   * subjectType → existence-check map. A static map covers resolvers that
   * close over nothing; the factory form injects repositories from the
   * imported feature modules. The template registers `{}` — attachments stay
   * dormant until the first feature claims a subject type.
   */
  subjects: SubjectResolvers | SubjectResolversFactory;
}

const isFactory = (
  subjects: AttachmentsModuleOptions['subjects'],
): subjects is SubjectResolversFactory =>
  typeof (subjects as SubjectResolversFactory).useFactory === 'function';

/**
 * Domain-blind by construction: this file names no feature module. The app's
 * composition root registers which subjects exist and how to verify them —
 * see app.module.ts for the wiring. A template app with no subjects yet
 * registers an empty map and adds entries as features land.
 */
@Module({})
export class AttachmentsModule {
  static forRoot(options: AttachmentsModuleOptions): DynamicModule {
    const resolversProvider: Provider = isFactory(options.subjects)
      ? {
          provide: ATTACHMENT_SUBJECT_RESOLVERS,
          inject: options.subjects.inject ?? [],
          useFactory: options.subjects.useFactory,
        }
      : { provide: ATTACHMENT_SUBJECT_RESOLVERS, useValue: options.subjects };

    return {
      module: AttachmentsModule,
      // Global like Storage/Database: registered once at the app root,
      // injectable by other feature modules (e.g. MCP tools wrap the service).
      global: true,
      imports: options.imports ?? [],
      controllers: [AttachmentController],
      providers: [AttachmentsService, AttachmentRepository, resolversProvider],
      exports: [AttachmentsService],
    };
  }
}
