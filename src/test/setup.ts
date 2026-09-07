import "@testing-library/jest-dom/vitest";

// Mock IntersectionObserver for motion/react (framer-motion)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;
