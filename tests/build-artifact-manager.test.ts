/**
 * Test Suite for Build Artifact Manager
 * Tests webpack/vite build artifact parsing and analysis
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { BuildArtifactManager } from "../src/source-intelligence/build-artifact-manager";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

describe("BuildArtifactManager", () => {
  const testDir = join(process.cwd(), "test-build-artifacts");
  let manager: BuildArtifactManager;

  beforeAll(async () => {
    // Create test directory
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up test directory
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    manager = new BuildArtifactManager(testDir);
  });

  describe("Webpack Stats Loading", () => {
    it("should load webpack stats.json", async () => {
      const webpackStats = {
        version: "5.88.0",
        chunks: [
          {
            id: 0,
            files: ["main.js"],
            size: 10000,
            modules: [],
            entry: true,
            initial: true
          }
        ],
        modules: [
          {
            id: 1,
            name: "./src/index.js",
            size: 500,
            chunks: [0]
          },
          {
            id: 2,
            name: "./src/utils.js",
            size: 300,
            chunks: [0]
          }
        ],
        assets: [
          {
            name: "main.js",
            size: 10000,
            chunks: [0]
          }
        ],
        entrypoints: {
          main: {
            chunks: [0],
            assets: ["main.js"]
          }
        }
      };

      // Create dist directory and stats.json
      const distDir = join(testDir, "dist");
      await mkdir(distDir, { recursive: true });
      await writeFile(
        join(distDir, "stats.json"),
        JSON.stringify(webpackStats)
      );

      await manager.loadBuildArtifacts();
      expect(manager.isLoaded()).toBe(true);

      const summary = manager.getSummary();
      expect(summary.type).toBe("webpack");
      expect(summary.totalModules).toBe(2);
      expect(summary.totalChunks).toBe(1);
      expect(summary.totalSize).toBe(800); // 500 + 300
    });

    it("should parse webpack modules correctly", async () => {
      const stats = {
        modules: [
          {
            id: "module1",
            name: "./src/components/App.jsx",
            size: 1500,
            chunks: [0, 1]
          }
        ],
        chunks: [],
        assets: []
      };

      await mkdir(join(testDir, "dist"), { recursive: true });
      await writeFile(
        join(testDir, "dist", "stats.json"),
        JSON.stringify(stats)
      );

      await manager.loadBuildArtifacts();

      const module = manager.findModule("App.jsx");
      expect(module).toBeDefined();
      expect(module?.size).toBe(1500);
      expect(module?.chunks).toEqual([0, 1]);
    });
  });

  describe("Vite Manifest Loading", () => {
    it("should load vite manifest.json", async () => {
      const viteManifest = {
        "src/main.ts": {
          file: "assets/main.abc123.js",
          src: "src/main.ts",
          isEntry: true,
          css: ["assets/main.def456.css"]
        },
        "src/components/Button.vue": {
          file: "assets/Button.ghi789.js",
          src: "src/components/Button.vue"
        }
      };

      // Create vite manifest location
      const viteDir = join(testDir, "dist", ".vite");
      await mkdir(viteDir, { recursive: true });
      await writeFile(
        join(viteDir, "manifest.json"),
        JSON.stringify(viteManifest)
      );

      await manager.loadBuildArtifacts();
      expect(manager.isLoaded()).toBe(true);

      const summary = manager.getSummary();
      expect(summary.type).toBe("vite");
      expect(summary.totalModules).toBe(2);
    });

    it("should identify vite entry chunks", async () => {
      const manifest = {
        "src/app.ts": {
          file: "app.123.js",
          isEntry: true
        },
        "src/lib.ts": {
          file: "lib.456.js",
          isEntry: false
        }
      };

      const viteDir = join(testDir, "dist", ".vite");
      await mkdir(viteDir, { recursive: true });
      await writeFile(
        join(viteDir, "manifest.json"),
        JSON.stringify(manifest)
      );

      await manager.loadBuildArtifacts();

      const summary = manager.getSummary();
      expect(summary.totalChunks).toBeGreaterThan(0);
    });
  });

  describe("Module Lookup", () => {
    beforeEach(async () => {
      const stats = {
        modules: [
          { id: 1, name: "./src/index.js", size: 100, chunks: [0] },
          { id: 2, name: "./src/utils/helper.js", size: 200, chunks: [0] },
          { id: 3, name: "node_modules/react/index.js", size: 50000, chunks: [0] }
        ],
        chunks: [{ id: 0, modules: [], files: ["main.js"] }],
        assets: []
      };

      await mkdir(join(testDir, "dist"), { recursive: true });
      await writeFile(
        join(testDir, "dist", "stats.json"),
        JSON.stringify(stats)
      );

      await manager.loadBuildArtifacts();
    });

    it("should find module by exact path", () => {
      const module = manager.findModule("./src/index.js");
      expect(module).toBeDefined();
      expect(module?.size).toBe(100);
    });

    it("should find module by partial path", () => {
      const module = manager.findModule("helper.js");
      expect(module).toBeDefined();
      expect(module?.name).toContain("helper.js");
    });

    it("should find module by relative path", () => {
      const module = manager.findModule("src/utils/helper.js");
      expect(module).toBeDefined();
    });

    it("should return undefined for non-existent module", () => {
      const module = manager.findModule("non-existent.js");
      expect(module).toBeUndefined();
    });
  });

  describe("Chunk Analysis", () => {
    beforeEach(async () => {
      const stats = {
        chunks: [
          {
            id: "main",
            files: ["main.js"],
            size: 5000,
            modules: [
              { id: 1, name: "index.js" },
              { id: 2, name: "app.js" }
            ],
            entry: true
          },
          {
            id: "vendor",
            files: ["vendor.js"],
            size: 50000,
            modules: [
              { id: 3, name: "react" },
              { id: 4, name: "lodash" }
            ]
          }
        ],
        modules: [],
        assets: []
      };

      await mkdir(join(testDir, "dist"), { recursive: true });
      await writeFile(
        join(testDir, "dist", "stats.json"),
        JSON.stringify(stats)
      );

      await manager.loadBuildArtifacts();
    });

    it("should find chunk containing a module", () => {
      const chunk = manager.getChunkForModule("index.js");
      expect(chunk).toBeDefined();
      expect(chunk?.id).toBe("main");
    });

    it("should identify entry chunks", () => {
      const chunk = manager.getChunkForModule("index.js");
      expect(chunk?.entry).toBe(true);
    });
  });

  describe("Build Summary", () => {
    it("should calculate total sizes correctly", async () => {
      const stats = {
        modules: [
          { id: 1, name: "a.js", size: 1000, chunks: [] },
          { id: 2, name: "b.js", size: 2000, chunks: [] },
          { id: 3, name: "c.js", size: 3000, chunks: [] }
        ],
        chunks: [],
        assets: []
      };

      await mkdir(join(testDir, "dist"), { recursive: true });
      await writeFile(
        join(testDir, "dist", "stats.json"),
        JSON.stringify(stats)
      );

      await manager.loadBuildArtifacts();

      const summary = manager.getSummary();
      expect(summary.totalSize).toBe(6000);
    });

    it("should identify largest modules", async () => {
      const stats = {
        modules: [
          { id: 1, name: "small.js", size: 100, chunks: [] },
          { id: 2, name: "medium.js", size: 500, chunks: [] },
          { id: 3, name: "large.js", size: 5000, chunks: [] },
          { id: 4, name: "huge.js", size: 10000, chunks: [] }
        ],
        chunks: [],
        assets: []
      };

      await mkdir(join(testDir, "dist"), { recursive: true });
      await writeFile(
        join(testDir, "dist", "stats.json"),
        JSON.stringify(stats)
      );

      await manager.loadBuildArtifacts();

      const summary = manager.getSummary();
      expect(summary.largestModules[0].name).toBe("huge.js");
      expect(summary.largestModules[1].name).toBe("large.js");
    });
  });

  describe("Alternative Locations", () => {
    it("should check alternate build locations", async () => {
      const stats = {
        modules: [{ id: 1, name: "next.js", size: 1000, chunks: [] }],
        chunks: [],
        assets: []
      };

      // Try Next.js location
      const nextDir = join(testDir, ".next");
      await mkdir(nextDir, { recursive: true });
      await writeFile(
        join(nextDir, "build-manifest.json"),
        JSON.stringify(stats)
      );

      await manager.loadBuildArtifacts();
      expect(manager.isLoaded()).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should throw error when no artifacts found", async () => {
      await expect(manager.loadBuildArtifacts()).rejects.toThrow(
        "No build artifacts found"
      );
    });

    it("should handle malformed JSON gracefully", async () => {
      await mkdir(join(testDir, "dist"), { recursive: true });
      await writeFile(
        join(testDir, "dist", "stats.json"),
        "{ invalid json }"
      );

      await expect(manager.loadBuildArtifacts()).rejects.toThrow();
    });

    it("should throw error when getting summary without manifest", () => {
      expect(() => manager.getSummary()).toThrow("No manifest loaded");
    });
  });

  describe("Cleanup", () => {
    it("should clear loaded data", async () => {
      const stats = {
        modules: [{ id: 1, name: "test.js", size: 100, chunks: [] }],
        chunks: [],
        assets: []
      };

      await mkdir(join(testDir, "dist"), { recursive: true });
      await writeFile(
        join(testDir, "dist", "stats.json"),
        JSON.stringify(stats)
      );

      await manager.loadBuildArtifacts();
      expect(manager.isLoaded()).toBe(true);

      manager.clear();
      expect(manager.isLoaded()).toBe(false);
      expect(manager.findModule("test.js")).toBeUndefined();
    });
  });
});