import '@testing-library/jest-dom';

global.runtime = {
  BrowserOpenURL: vi.fn(),
  Quit: vi.fn(),
  WindowMinimise: vi.fn(),
};
