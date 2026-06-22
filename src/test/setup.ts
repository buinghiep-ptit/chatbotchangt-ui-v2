import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrollIntoView; stub it so components that auto-scroll
// (e.g. MessageList) can be rendered in tests.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom does not implement object URLs; stub them so attachment thumbnails render.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock'
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {}
}
