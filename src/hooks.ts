import { createHooks } from "@wordpress/hooks";

declare global {
  interface Window {
    pvHooks: any;
  }
}

if (!window.pvHooks) {
  let pvHooks = createHooks();
  (window as any).pvHooks = pvHooks;
}

export const {
  filters,
  addFilter,
  applyFilters,
  applyFiltersAsync,
  removeFilter,
  removeAllFilters,
  actions,
  addAction,
  doAction,
  doActionAsync,
  removeAction,
  removeAllActions,
} = window.pvHooks;

export default window.pvHooks;
