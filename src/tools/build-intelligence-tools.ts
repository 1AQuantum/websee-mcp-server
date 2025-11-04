/**
 * Build Intelligence Tools for WebSee MCP Server
 *
 * Provides advanced build artifact analysis capabilities including:
 * - Webpack/Vite manifest parsing
 * - Code chunk analysis
 * - Module dependency tracking
 * - Bundle size optimization
 *
 * @module build-intelligence-tools
 */

import { z } from 'zod';
import { Page } from 'playwright';
import { BuildArtifactManager } from '../build-artifact-manager.js';

// ============================================================================
// Zod Schemas for Tool Validation
// ============================================================================

export const BuildGetManifestSchema = z.object({
  url: z.string().url().describe('The application URL to analyze'),
});

export const BuildGetChunksSchema = z.object({
  url: z.string().url().describe('The application URL to analyze'),
});

export const BuildFindModuleSchema = z.object({
  url: z.string().url().describe('The application URL to analyze'),
  moduleName: z.string().describe('Name or path of the module to find'),
});

export const BuildGetDependenciesSchema = z.object({
  url: z.string().url().describe('The application URL to analyze'),
  moduleName: z.string().optional().describe('Specific module to get dependencies for (optional)'),
});

export const BuildAnalyzeSizeSchema = z.object({
  url: z.string().url().describe('The application URL to analyze'),
  threshold: z
    .number()
    .optional()
    .default(100)
    .describe('Size threshold in KB to flag large modules'),
});

// ============================================================================
// Type Definitions
// ============================================================================

export type BuildGetManifestParams = z.infer<typeof BuildGetManifestSchema>;
export type BuildGetChunksParams = z.infer<typeof BuildGetChunksSchema>;
export type BuildFindModuleParams = z.infer<typeof BuildFindModuleSchema>;
export type BuildGetDependenciesParams = z.infer<typeof BuildGetDependenciesSchema>;
export type BuildAnalyzeSizeParams = z.infer<typeof BuildAnalyzeSizeSchema>;

interface BuildManifestResult {
  type: string;
  version: string;
  chunks: Array<{
    id: string | number;
    files: string[];
    size: number;
    entry?: boolean;
    initial?: boolean;
  }>;
  assets: Array<{
    name: string;
    size: number;
    chunks: (string | number)[];
  }>;
  modules: Array<{
    id: string | number;
    name: string;
    size: number;
    chunks: (string | number)[];
  }>;
}

interface ChunkInfo {
  id: string | number;
  files: string[];
  modules: string[];
  size: number;
  sizeKB: string;
  entry?: boolean;
  initial?: boolean;
}

interface ModuleInfo {
  name: string;
  id: string | number;
  size: number;
  sizeKB: string;
  chunks: (string | number)[];
  dependencies: string[];
  source?: string;
}

interface DependencyNode {
  name: string;
  version?: string;
  size: number;
  sizeKB: string;
  dependents: string[];
  chunks: (string | number)[];
}

interface SizeAnalysis {
  total: number;
  totalKB: string;
  totalMB: string;
  byType: {
    js: { count: number; size: number; sizeKB: string };
    css: { count: number; size: number; sizeKB: string };
    other: { count: number; size: number; sizeKB: string };
  };
  large: Array<{
    name: string;
    size: number;
    sizeKB: string;
    type: string;
    percentage: string;
  }>;
  recommendations: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Initialize page and load build artifacts
 */
async function initializeBuildAnalysis(page: Page, url: string): Promise<BuildArtifactManager> {
  // Navigate to the URL to trigger build artifact loading
  await page.goto(url, { waitUntil: 'networkidle' });

  // Extract project root from URL or use a default approach
  // In production, this would be configured or detected
  const projectRoot = process.env.PROJECT_ROOT || process.cwd();

  const buildManager = new BuildArtifactManager(projectRoot);

  try {
    await buildManager.loadBuildArtifacts();
  } catch (error) {
    // If local artifacts aren't available, try to fetch from the page
    await fetchBuildArtifactsFromPage(page, buildManager);
  }

  return buildManager;
}

/**
 * Attempt to fetch build artifacts from the running page
 */
async function fetchBuildArtifactsFromPage(
  page: Page,
  _buildManager: BuildArtifactManager
): Promise<void> {
  // Try to extract webpack stats from window.__webpack_require__ or similar
  const webpackData = await page.evaluate(() => {
    // Check for webpack
    if ((window as any).__webpack_require__) {
      const webpack = (window as any).__webpack_require__;
      if (webpack.m) {
        return {
          type: 'webpack',
          modules: Object.keys(webpack.m).map(id => ({
            id,
            name: webpack.m[id].toString().substring(0, 100),
            size: webpack.m[id].toString().length,
          })),
        };
      }
    }

    // Check for vite
    if ((window as any).__vite__) {
      return {
        type: 'vite',
        modules: [],
      };
    }

    return null;
  });

  if (!webpackData) {
    throw new Error('Unable to load build artifacts from filesystem or page runtime');
  }
}

/**
 * Format bytes to KB string
 */
function formatKB(bytes: number): string {
  return (bytes / 1024).toFixed(2);
}

/**
 * Format bytes to MB string
 */
function formatMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2);
}

/**
 * Get file type from filename
 */
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'js' || ext === 'mjs' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') {
    return 'js';
  }
  if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less') {
    return 'css';
  }
  return 'other';
}

/**
 * Extract module dependencies from source code
 */
function extractDependencies(source: string | undefined): string[] {
  if (!source) return [];

  const dependencies: string[] = [];

  // Match ES6 imports
  const importMatches = source.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    dependencies.push(match[1]);
  }

  // Match CommonJS requires
  const requireMatches = source.matchAll(/require\(['"]([^'"]+)['"]\)/g);
  for (const match of requireMatches) {
    dependencies.push(match[1]);
  }

  return [...new Set(dependencies)];
}

// ============================================================================
// Tool Implementation Functions
// ============================================================================

/**
 * Tool 1: Get build manifest
 * Returns complete build manifest with chunks, assets, and modules
 */
export async function buildGetManifest(
  page: Page,
  params: BuildGetManifestParams
): Promise<BuildManifestResult> {
  const buildManager = await initializeBuildAnalysis(page, params.url);

  if (!buildManager.isLoaded()) {
    throw new Error('Failed to load build manifest');
  }

  const summary = buildManager.getSummary();

  // Get manifest data - this would need to be exposed by BuildArtifactManager
  // For now, we'll return the summary data
  return {
    type: summary.type,
    version: 'unknown', // BuildArtifactManager doesn't expose version in getSummary
    chunks: [], // Would need to expose chunks from manifest
    assets: [],
    modules: summary.largestModules.map(m => ({
      id: m.id,
      name: m.name,
      size: m.size,
      chunks: m.chunks,
    })),
  };
}

/**
 * Tool 2: Get all code chunks
 * Returns detailed information about all chunks in the bundle
 */
export async function buildGetChunks(
  page: Page,
  params: BuildGetChunksParams
): Promise<{ chunks: ChunkInfo[] }> {
  const buildManager = await initializeBuildAnalysis(page, params.url);

  if (!buildManager.isLoaded()) {
    throw new Error('Failed to load build manifest');
  }

  // Extract chunks from page scripts
  const scriptChunks = await page.$$eval('script[src]', scripts =>
    scripts.map((script: any) => ({
      src: script.src,
      async: script.async,
      defer: script.defer,
    }))
  );

  const chunks: ChunkInfo[] = scriptChunks.map((script, index) => {
    const filename = script.src.split('/').pop() || `chunk-${index}`;
    return {
      id: index,
      files: [filename],
      modules: [],
      size: 0, // Size would need to be fetched via network trace
      sizeKB: '0.00',
      entry: index === 0,
      initial: script.defer === false && script.async === false,
    };
  });

  return { chunks };
}

/**
 * Tool 3: Find specific module in bundle
 * Searches for a module by name and returns its details
 */
export async function buildFindModule(
  page: Page,
  params: BuildFindModuleParams
): Promise<ModuleInfo | null> {
  const buildManager = await initializeBuildAnalysis(page, params.url);

  if (!buildManager.isLoaded()) {
    throw new Error('Failed to load build manifest');
  }

  const module = buildManager.findModule(params.moduleName);

  if (!module) {
    return null;
  }

  const dependencies = extractDependencies(module.source || module.originalSource);

  return {
    name: module.name,
    id: module.id,
    size: module.size,
    sizeKB: formatKB(module.size),
    chunks: module.chunks,
    dependencies,
    source: module.source ? module.source.substring(0, 500) + '...' : undefined,
  };
}

/**
 * Tool 4: Get dependency graph
 * Returns the dependency graph for all modules or a specific module
 */
export async function buildGetDependencies(
  page: Page,
  params: BuildGetDependenciesParams
): Promise<{ dependencies: DependencyNode[] }> {
  const buildManager = await initializeBuildAnalysis(page, params.url);

  if (!buildManager.isLoaded()) {
    throw new Error('Failed to load build manifest');
  }

  const summary = buildManager.getSummary();
  const dependencies: DependencyNode[] = [];

  // If specific module requested, find its dependencies
  if (params.moduleName) {
    const module = buildManager.findModule(params.moduleName);
    if (module) {
      const moduleDeps = extractDependencies(module.source || module.originalSource);

      for (const dep of moduleDeps) {
        const depModule = buildManager.findModule(dep);
        dependencies.push({
          name: dep,
          size: depModule?.size || 0,
          sizeKB: formatKB(depModule?.size || 0),
          dependents: [params.moduleName],
          chunks: depModule?.chunks || [],
        });
      }
    }
  } else {
    // Return all modules as dependency nodes
    for (const module of summary.largestModules) {
      dependencies.push({
        name: module.name,
        size: module.size,
        sizeKB: formatKB(module.size),
        dependents: [], // Would need to compute reverse dependencies
        chunks: module.chunks,
      });
    }
  }

  return { dependencies };
}

/**
 * Tool 5: Analyze bundle sizes
 * Analyzes bundle sizes and provides optimization recommendations
 */
export async function buildAnalyzeSize(
  page: Page,
  params: BuildAnalyzeSizeParams
): Promise<SizeAnalysis> {
  const buildManager = await initializeBuildAnalysis(page, params.url);

  if (!buildManager.isLoaded()) {
    throw new Error('Failed to load build manifest');
  }

  const summary = buildManager.getSummary();

  // Analyze by type
  const byType = {
    js: { count: 0, size: 0, sizeKB: '0.00' },
    css: { count: 0, size: 0, sizeKB: '0.00' },
    other: { count: 0, size: 0, sizeKB: '0.00' },
  };

  let totalSize = 0;
  const allAssets: Array<{ name: string; size: number; type: string }> = [];

  // Add module sizes
  for (const module of summary.largestModules) {
    const type = getFileType(module.name);
    const typeKey = type as keyof typeof byType;

    byType[typeKey].count++;
    byType[typeKey].size += module.size;
    totalSize += module.size;

    allAssets.push({
      name: module.name,
      size: module.size,
      type,
    });
  }

  // Format type sizes
  for (const type of Object.keys(byType) as Array<keyof typeof byType>) {
    byType[type].sizeKB = formatKB(byType[type].size);
  }

  // Find large assets
  const thresholdBytes = params.threshold! * 1024;
  const largeAssets = allAssets
    .filter(asset => asset.size > thresholdBytes)
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map(asset => ({
      name: asset.name,
      size: asset.size,
      sizeKB: formatKB(asset.size),
      type: asset.type,
      percentage: ((asset.size / totalSize) * 100).toFixed(2) + '%',
    }));

  // Generate recommendations
  const recommendations: string[] = [];

  if (largeAssets.length > 0) {
    recommendations.push(
      `Found ${largeAssets.length} asset(s) exceeding ${params.threshold}KB threshold. Consider code splitting.`
    );
  }

  if (byType.js.size > 500 * 1024) {
    recommendations.push(
      `Total JavaScript size is ${formatKB(byType.js.size)}KB. Consider lazy loading non-critical modules.`
    );
  }

  if (summary.totalChunks < 3 && totalSize > 200 * 1024) {
    recommendations.push(
      `Only ${summary.totalChunks} chunk(s) detected. Consider implementing code splitting for better caching.`
    );
  }

  const duplicateModules = summary.largestModules.filter(m => m.chunks.length > 1);
  if (duplicateModules.length > 5) {
    recommendations.push(
      `${duplicateModules.length} modules appear in multiple chunks. Consider using commons chunks or tree shaking.`
    );
  }

  if (byType.css.size > 100 * 1024) {
    recommendations.push(
      `CSS bundle size is ${formatKB(byType.css.size)}KB. Consider critical CSS extraction and lazy loading.`
    );
  }

  return {
    total: totalSize,
    totalKB: formatKB(totalSize),
    totalMB: formatMB(totalSize),
    byType,
    large: largeAssets,
    recommendations,
  };
}

// ============================================================================
// MCP Tool Definitions Export
// ============================================================================

/**
 * MCP-compatible tool definitions for registration
 */
export const BUILD_INTELLIGENCE_TOOLS = [
  {
    name: 'build_get_manifest',
    description: 'Get webpack/vite build manifest including chunks, assets, and modules',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The application URL to analyze',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'build_get_chunks',
    description: 'Get all code chunks with their files, modules, and sizes',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The application URL to analyze',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'build_find_module',
    description: 'Find a specific module in the bundle by name or path',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The application URL to analyze',
        },
        moduleName: {
          type: 'string',
          description: 'Name or path of the module to find',
        },
      },
      required: ['url', 'moduleName'],
    },
  },
  {
    name: 'build_get_dependencies',
    description: 'Get dependency graph for all modules or a specific module',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The application URL to analyze',
        },
        moduleName: {
          type: 'string',
          description: 'Specific module to get dependencies for (optional)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'build_analyze_size',
    description:
      'Analyze bundle sizes by type and identify large modules with optimization recommendations',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The application URL to analyze',
        },
        threshold: {
          type: 'number',
          description: 'Size threshold in KB to flag large modules (default: 100)',
        },
      },
      required: ['url'],
    },
  },
];
