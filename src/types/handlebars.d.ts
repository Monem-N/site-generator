// This file is used to resolve conflicts between @types/handlebars and handlebars/types
// It provides a merged type definition that works with both

declare module 'handlebars' {
  import * as hbs from 'handlebars';
  export = hbs;
}

declare namespace Handlebars {
  interface KnownHelpers {
    helperMissing?: boolean;
    blockHelperMissing?: boolean;
    each?: boolean;
    if?: boolean;
    unless?: boolean;
    with?: boolean;
    log?: boolean;
    lookup?: boolean;
  }

  interface RuntimeOptions {
    data?: boolean;
    compat?: boolean;
    knownHelpers?: KnownHelpers;
    knownHelpersOnly?: boolean;
    noEscape?: boolean;
    strict?: boolean;
    trackIds?: boolean;
    preventIndent?: boolean;
    ignoreStandalone?: boolean;
    explicitPartialContext?: boolean;
  }

  interface HelperDelegate {
    (
      context?: unknown,
      arg1?: unknown,
      arg2?: unknown,
      arg3?: unknown,
      arg4?: unknown,
      arg5?: unknown,
      options?: HelperOptions
    ): unknown;
  }

  interface HelperOptions {
    fn: TemplateDelegate;
    inverse: TemplateDelegate;
    hash?: unknown;
    data?: unknown;
  }

  interface SafeString {
    toString(): string;
    toHTML(): string;
  }

  interface Template {
    (context: unknown, options?: RuntimeOptions): string;
  }

  interface TemplateDelegate {
    (context: unknown, options?: RuntimeOptions): string;
  }

  interface Utils {
    escapeExpression(str: string): string;
    createFrame(object: unknown): Record<string, unknown>;
    isEmpty(value: unknown): boolean;
    extend(obj: unknown, ...source: unknown[]): Record<string, unknown>;
    toString(obj: unknown): string;
    isArray(obj: unknown): boolean;
    isFunction(obj: unknown): boolean;
  }
}
