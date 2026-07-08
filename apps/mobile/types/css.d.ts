// Ambient declarations for CSS side-effect / CSS-module imports.
// `global.css` is imported for its side effects (font tokens; NativeWind later).
// `*.module.css` is used by the web-only variant components.
declare module '*.css';

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
