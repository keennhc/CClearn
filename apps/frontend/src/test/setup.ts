import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement scrollIntoView; components that auto-scroll message
// lists (chat pages) call it in an effect, which throws without this stub.
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
