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
      context?: any,
      arg1?: any,
      arg2?: any,
      arg3?: any,
      arg4?: any,
      arg5?: any,
      options?: HelperOptions
    ): any;
  }

  interface HelperOptions {
    fn: TemplateDelegate;
    inverse: TemplateDelegate;
    hash: any;
    data?: any;
  }

  interface SafeString {
    toString(): string;
    toHTML(): string;
  }

  interface Template {
    (context: any, options?: RuntimeOptions): string;
  }

  interface TemplateDelegate {
    (context: any, options?: RuntimeOptions): string;
  }

  interface Utils {
    escapeExpression(str: string): string;
    createFrame(object: any): any;
    isEmpty(value: any): boolean;
    extend(obj: any, ...source: any[]): any;
    toString(obj: any): string;
    isArray(obj: any): boolean;
    isFunction(obj: any): boolean;
  }
}
