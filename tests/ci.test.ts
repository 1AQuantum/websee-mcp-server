import { describe, it, expect, vi } from "vitest";

import {
  ci_status,
  ci_rerun,
  git_open_pr,
  git_comment_pr,
  lint_run,
} from "../src/tools/ci.js";

vi.mock("../src/tools/utils.js", async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    ok: actual.ok,
    fail: actual.fail,
  };
});

vi.mock("../src/tools/ci.js", async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    __esModule: true,
    ...actual,
  };
});

vi.mock("child_process", () => {
  const EventEmitter = class {
    stdout = new (class extends EventEmitter {})();
    stderr = new (class extends EventEmitter {})();
    listeners: Record<string, Function[]> = {};
    on(event: string, handler: Function) {
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(handler);
      return this;
    }
    emit(event: string, ...args: any[]) {
      (this.listeners[event] || []).forEach((fn) => fn(...args));
    }
  };
  return {
    spawn: (..._args: any[]) => {
      const proc = new EventEmitter();
      queueMicrotask(() => {
        proc.stdout.emit("data", JSON.stringify([{ name: "build", status: "success", conclusion: "success", htmlUrl: "" }]));
        proc.emit("close", 0);
      });
      return proc;
    },
  };
});

describe("ci tools", () => {
  it("fetches ci status in dry run", async () => {
    const res = await ci_status({ provider: "github", dryRun: true });
    expect(res.ok).toBe(true);
    expect(res.summary).toMatch(/Dry run/);
  });

  it("supports dry run pr create", async () => {
    const res = await git_open_pr({ base: "main", title: "Test", body: "Body", dryRun: true });
    expect(res.ok).toBe(true);
    expect(res.summary).toMatch(/Dry run/);
  });

  it("runs lint with dry run", async () => {
    const res = await lint_run({ dryRun: true });
    expect(res.ok).toBe(true);
  });
});

