import { describe, it, expect, vi } from "vitest";

import { browser_visual_diff, browser_get_styles, browser_multi_viewport_capture } from "../src/tools/visual.js";

vi.mock("../src/adapters/playwright.js", () => {
  const screenshotMock = vi.fn(async ({ path }: any) => {
    const fs = await import("fs");
    fs.writeFileSync(path, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });
  const locator = {
    count: vi.fn(async () => 1),
    evaluate: vi.fn(async () => ({ display: "block" })),
    screenshot: screenshotMock,
  };
  return {
    getHandles: async () => ({
      page: {
        locator: vi.fn(() => locator),
        screenshot: screenshotMock,
        setViewportSize: vi.fn(async () => {}),
        viewportSize: vi.fn(async () => ({ width: 1280, height: 720 })),
        url: vi.fn(() => "http://example.com"),
        goto: vi.fn(async () => {}),
        waitForTimeout: vi.fn(async () => {}),
        accessibility: { snapshot: vi.fn(async () => ({})) },
      },
    }),
    browserInfo: async () => ({ engine: "chromium", version: "1.0", channel: "" }),
  };
});

vi.mock("pngjs", () => {
  return {
    PNG: {
      sync: {
        read: () => ({ width: 1, height: 1, data: Buffer.alloc(4) }),
        write: () => Buffer.alloc(4),
      },
    },
  };
});

vi.mock("pixelmatch", () => {
  return {
    default: vi.fn(() => 0),
  };
});

describe("visual tools", () => {
  it("returns baseline created when no baseline exists", async () => {
    const res = await browser_visual_diff({ baselineId: "home" });
    expect(res.ok).toBe(true);
    expect(res.summary).toMatch(/Baseline/);
  });

  it("returns styles for locator", async () => {
    const res = await browser_get_styles({ locator: "css=body" });
    expect(res.ok).toBe(true);
    expect(res.data?.styles).toBeTruthy();
  });

  it("captures multi viewport screenshots", async () => {
    const res = await browser_multi_viewport_capture({ viewports: [{ name: "test", width: 100, height: 200 }] });
    expect(res.ok).toBe(true);
    expect(res.data?.captures?.length).toBe(1);
  });
});

