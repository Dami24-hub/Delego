let serverInstance: {
  listen: (options?: unknown) => void;
  resetHandlers: () => void;
  close: () => void;
  use: (...handlers: unknown[]) => void;
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { setupServer } = require("msw/node");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { handlers } = require("./handlers");
  serverInstance = setupServer(...handlers);
} catch {
  // Fallback mock server for test environments where msw is absent
  serverInstance = {
    listen: () => {},
    resetHandlers: () => {},
    close: () => {},
    use: () => {},
  };
}

export const server = serverInstance;
