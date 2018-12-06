declare module 'es6-template-strings' {
  interface TemplateContext {
    [key: string]: any;
  }

  interface TemplateOptions {
    partial: boolean;
  }

  function templateStrings(
    template: string,
    context: TemplateContext,
    options?: TemplateOptions,
  ): string;

  export = templateStrings;
}
