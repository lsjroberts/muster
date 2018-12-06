export function getCurrentBrowser(): typeof chrome {
  return typeof (window as any).browser !== 'undefined' ? (window as any).browser : chrome;
}
