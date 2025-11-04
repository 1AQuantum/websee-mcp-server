import { describe, it, expect } from "vitest";

import { ok, fail, computeLocatorProvenance } from "../src/tools/utils.js";

describe("utils", () => {
  it("wraps success responses with normalized diagnostics", () => {
    const res = ok({ value: 42 }, "summary", [{ message: "info" }]);

    expect(res.ok).toBe(true);
    expect(res.summary).toBe("summary");
    expect(res.data).toEqual({ value: 42 });
    expect(res.diagnostics).toEqual([{ level: "info", message: "info", context: undefined }]);
  });

  it("wraps failure responses with diagnostics", () => {
    const res = fail("ERR", "boom", false, [{ level: "warn", message: "details" }]);

    expect(res.ok).toBe(false);
    expect(res.error).toEqual({ code: "ERR", message: "boom", retryable: false });
    expect(res.diagnostics).toEqual([{ level: "warn", message: "details" }]);
  });

  it("derives locator provenance from role locator", () => {
    const prov = computeLocatorProvenance("role=button[name='Save']", {});

    expect(prov.usedLocator).toBe("role=button[name='Save']");
    expect(prov.role).toBe("button");
    expect(prov.name).toBe("Save");
    expect(prov.selectorHints).toContain("role:button");
    expect(prov.retries).toBe(0);
  });
});

