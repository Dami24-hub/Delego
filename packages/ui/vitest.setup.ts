import "@testing-library/jest-dom/vitest";
import { afterEach, expect } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

