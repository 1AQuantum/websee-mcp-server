/**
 * Build Analyzer Agent
 * Parses and analyzes webpack/vite build artifacts for source intelligence
 * Part of the WebSee Source Intelligence Layer
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

interface BuildModule {
  id: string | number;
  name: string;
  size: number;
  chunks: (string | number)[];
  source?: string;
  originalSource?: string;
}

interface BuildChunk {
  id: string | number;
  files: string[];
  size: number;
  modules: BuildModule[];
  entry?: boolean;
  initial?: boolean;
}

interface BuildManifest {
  type: 'webpack' | 'vite' | 'unknown';
  version: string;
  chunks: BuildChunk[];
  modules: BuildModule[];
  assets: {
    name: string;
    size: number;
    chunks: (string | number)[];
  }[];
  entrypoints: Record<
    string,
    {
      chunks: (string | number)[];
      assets: string[];
    }
  >;
}

export class BuildArtifactManager {
  private manifest: BuildManifest | null = null;
  private projectRoot: string;
  private moduleMap: Map<string, BuildModule> = new Map();

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = resolve(projectRoot);
  }

  /**
   * Load build artifacts from webpack stats or vite manifest
   */
  async loadBuildArtifacts(): Promise<void> {
    // Try webpack stats.json first
    const webpackStats = join(this.projectRoot, 'dist', 'stats.json');
    if (existsSync(webpackStats)) {
      await this.loadWebpackStats(webpackStats);
      return;
    }

    // Try vite manifest.json
    const viteManifest = join(this.projectRoot, 'dist', '.vite', 'manifest.json');
    if (existsSync(viteManifest)) {
      await this.loadViteManifest(viteManifest);
      return;
    }

    // Try common alternate locations
    const alternateLocations = [
      'build/stats.json',
      '.next/build-manifest.json',
      'public/build/manifest.json',
    ];

    for (const location of alternateLocations) {
      const path = join(this.projectRoot, location);
      if (existsSync(path)) {
        const content = await readFile(path, 'utf-8');
        const data = JSON.parse(content);
        this.processGenericManifest(data);
        return;
      }
    }

    throw new Error('No build artifacts found. Please run build first.');
  }

  /**
   * Load and parse webpack stats.json
   */
  private async loadWebpackStats(statsPath: string): Promise<void> {
    const content = await readFile(statsPath, 'utf-8');
    const stats = JSON.parse(content);

    this.manifest = {
      type: 'webpack',
      version: stats.version || 'unknown',
      chunks: this.parseWebpackChunks(stats.chunks || []),
      modules: this.parseWebpackModules(stats.modules || []),
      assets: stats.assets || [],
      entrypoints: stats.entrypoints || {},
    };

    this.buildModuleMap();
  }

  /**
   * Load and parse vite manifest.json
   */
  private async loadViteManifest(manifestPath: string): Promise<void> {
    const content = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    const modules: BuildModule[] = [];
    const chunks: BuildChunk[] = [];

    // Parse vite manifest format
    Object.entries(manifest).forEach(([file, info]: [string, any]) => {
      if (info.isEntry) {
        chunks.push({
          id: file,
          files: [info.file, ...(info.css || [])],
          size: 0, // Vite doesn't provide size in manifest
          modules: [],
          entry: true,
          initial: true,
        });
      }

      modules.push({
        id: file,
        name: file,
        size: 0,
        chunks: [file],
        source: info.src,
      });
    });

    this.manifest = {
      type: 'vite',
      version: 'unknown',
      chunks,
      modules,
      assets: Object.values(manifest).map((info: any) => ({
        name: info.file,
        size: 0,
        chunks: [],
      })),
      entrypoints: {},
    };

    this.buildModuleMap();
  }

  /**
   * Parse webpack chunks
   */
  private parseWebpackChunks(chunks: any[]): BuildChunk[] {
    return chunks.map(chunk => ({
      id: chunk.id,
      files: chunk.files || [],
      size: chunk.size || 0,
      modules: chunk.modules || [],
      entry: chunk.entry,
      initial: chunk.initial,
    }));
  }

  /**
   * Parse webpack modules
   */
  private parseWebpackModules(modules: any[]): BuildModule[] {
    return modules.map(module => ({
      id: module.id,
      name: module.name || module.identifier || String(module.id),
      size: module.size || 0,
      chunks: module.chunks || [],
      source: module.source,
      originalSource: module.originalSource,
    }));
  }

  /**
   * Process generic manifest format
   */
  private processGenericManifest(data: any): void {
    this.manifest = {
      type: 'unknown',
      version: data.version || 'unknown',
      chunks: data.chunks || [],
      modules: data.modules || [],
      assets: data.assets || [],
      entrypoints: data.entrypoints || {},
    };

    this.buildModuleMap();
  }

  /**
   * Build module lookup map
   */
  private buildModuleMap(): void {
    if (!this.manifest) return;

    this.moduleMap.clear();
    this.manifest.modules.forEach(module => {
      this.moduleMap.set(String(module.name), module);
      if (module.id !== module.name) {
        this.moduleMap.set(String(module.id), module);
      }
    });
  }

  /**
   * Find module by file path
   */
  findModule(filePath: string): BuildModule | undefined {
    // Try exact match
    let module = this.moduleMap.get(filePath);
    if (module) return module;

    // Try relative path
    const relativePath = filePath.replace(this.projectRoot, '').replace(/^\//, '');
    module = this.moduleMap.get(relativePath);
    if (module) return module;

    // Try partial match
    for (const [key, mod] of this.moduleMap.entries()) {
      if (key.includes(filePath) || filePath.includes(key)) {
        return mod;
      }
    }

    return undefined;
  }

  /**
   * Get chunk containing a module
   */
  getChunkForModule(moduleId: string | number): BuildChunk | undefined {
    if (!this.manifest) return undefined;

    return this.manifest.chunks.find(chunk =>
      chunk.modules.some(m => m.id === moduleId || m.name === moduleId)
    );
  }

  /**
   * Get build summary
   */
  getSummary(): {
    type: string;
    totalModules: number;
    totalChunks: number;
    totalSize: number;
    largestModules: BuildModule[];
  } {
    if (!this.manifest) {
      throw new Error('No manifest loaded');
    }

    const totalSize = this.manifest.modules.reduce((sum, m) => sum + m.size, 0);
    const largestModules = [...this.manifest.modules].sort((a, b) => b.size - a.size).slice(0, 10);

    return {
      type: this.manifest.type,
      totalModules: this.manifest.modules.length,
      totalChunks: this.manifest.chunks.length,
      totalSize,
      largestModules,
    };
  }

  /**
   * Get entrypoints
   */
  getEntrypoints(): Record<string, { chunks: (string | number)[]; assets: string[] }> {
    return this.manifest?.entrypoints || {};
  }

  /**
   * Check if manifest is loaded
   */
  isLoaded(): boolean {
    return this.manifest !== null;
  }

  /**
   * Clear loaded manifest
   */
  clear(): void {
    this.manifest = null;
    this.moduleMap.clear();
  }
}
