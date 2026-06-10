import { InjectPinoLogger } from 'nestjs-pino';

/**
 * Inject a context-bound {@link PinoLogger} without repeating the class name.
 *
 * Shorthand for `@InjectPinoLogger(MyClass.name)`. A constructor parameter
 * decorator receives the class constructor as its `target`, so the context is
 * derived automatically:
 *
 * ```ts
 * constructor(@InjectLogger() private readonly logger: PinoLogger) {}
 * ```
 *
 * Works on constructor parameters and class properties. Like `@InjectPinoLogger`,
 * the context is registered at decoration (import) time so `LoggerModule` can
 * provision a per-context logger.
 */
export function InjectLogger(): ParameterDecorator & PropertyDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex?: number) => {
    const ctor = typeof target === 'function' ? target : target.constructor;
    const decorate = InjectPinoLogger(ctor.name);

    if (typeof parameterIndex === 'number') {
      (decorate as ParameterDecorator)(target, propertyKey, parameterIndex);
    } else {
      (decorate as PropertyDecorator)(target, propertyKey as string | symbol);
    }
  };
}
