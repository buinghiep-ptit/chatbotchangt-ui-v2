import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrollIntoView; stub it so components that auto-scroll
// (e.g. MessageList) can be rendered in tests.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
