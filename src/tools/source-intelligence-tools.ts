/**
 * Source Intelligence Tools for WebSee MCP Server
 *
 * Provides advanced source mapping, debugging, and analysis capabilities
 * for frontend applications through the Model Context Protocol.
 *
 * @module source-intelligence-tools
 */

import { z } from "zod";
import { Page } from "playwright";
import { SourceMapResolver } from "../source-map-resolver.js";
import { BuildArtifactManager } from "../build-artifact-manager.js";

// ============================================================================
// Zod Schemas for Tool Input Validation
// ============================================================================

/**
 * Schema for source_map_resolve tool
 * Resolves a minified location to its original source
 */
export const SourceMapResolveSchema = z.object({
  url: z.string().url().describe("The URL of the minified JavaScript file"),
  line: z.number().int().positive().describe("Line number in minified file (1-indexed)"),
  column: z.number().int().min(0).describe("Column number in minified file (0-indexed)"),
});

/**
 * Schema for source_map_get_content tool
 * Retrieves original source file content
 */
export const SourceMapGetContentSchema = z.object({
  file: z.string().describe("Original source file path from source map"),
  startLine: z.number().int().positive().optional().describe("Start line number (1-indexed, optional)"),
  endLine: z.number().int().positive().optional().describe("End line number (1-indexed, optional)"),
});

/**
 * Schema for source_trace_stack tool
 * Enhances a complete stack trace with source maps
 */
export const SourceTraceStackSchema = z.object({
  stackTrace: z.string().describe("Full stack trace string to resolve"),
});

/**
 * Schema for source_find_definition tool
 * Finds function/class definition in source code
 */
export const SourceFindDefinitionSchema = z.object({
  functionName: z.string().describe("Name of the function or class to find"),
  file: z.string().optional().describe("Specific source file to search in (optional)"),
});

/**
 * Schema for source_get_symbols tool
 * Lists exports, imports, and types from a source file
 */
export const SourceGetSymbolsSchema = z.object({
  file: z.string().describe("Source file path to analyze"),
});

/**
 * Schema for source_map_bundle tool
 * Maps a bundle file to all its source files
 */
export const SourceMapBundleSchema = z.object({
  bundlePath: z.string().describe("Path or URL to the bundle file"),
});

/**
 * Schema for source_coverage_map tool
 * Maps code coverage data to source files
 */
export const SourceCoverageMapSchema = z.object({
  coverageData: z.record(z.any()).describe("V8 coverage data object"),
});

// ============================================================================
// Helper Types
// ============================================================================

interface StackFrame {
  functionName?: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  source?: string;
}

interface ResolvedStackFrame extends StackFrame {
  original: StackFrame;
  resolved: boolean;
}

// ============================================================================
// Tool Implementation Class
// ============================================================================

/**
 * SourceIntelligenceTools provides MCP-compatible source intelligence tools
 * for debugging and analyzing frontend applications.
 */
export class SourceIntelligenceTools {
  private sourceMapResolver: SourceMapResolver;
  private buildManager: BuildArtifactManager;
  private initialized = false;

  constructor(cacheSize = 50, projectRoot?: string) {
    this.sourceMapResolver = new SourceMapResolver(cacheSize);
    this.buildManager = new BuildArtifactManager(projectRoot);
  }

  /**
   * Initialize the tools with a Playwright page
   */
  async initialize(page: Page): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.sourceMapResolver.initialize(page);

    // Try to load build artifacts (non-blocking)
    try {
      await this.buildManager.loadBuildArtifacts();
    } catch (error) {
      console.warn("Build artifacts not loaded:", (error as Error).message);
    }

    this.initialized = true;
  }

  // ==========================================================================
  // Tool 1: source_map_resolve
  // ==========================================================================

  /**
   * Resolve a minified location to its original source
   *
   * @param params - URL, line, and column of minified code
   * @returns Original source location with file, line, column, name, and content
   */
  async sourceMapResolve(
    params: z.infer<typeof SourceMapResolveSchema>
  ): Promise<{
    file: string;
    line: number;
    column: number;
    name?: string;
    content?: string;
  } | null> {
    this.ensureInitialized();

    const location = await this.sourceMapResolver.resolveLocation(
      params.url,
      params.line,
      params.column
    );

    if (!location) {
      return null;
    }

    return {
      file: location.file,
      line: location.line,
      column: location.column,
      name: location.name,
      content: location.content,
    };
  }

  // ==========================================================================
  // Tool 2: source_map_get_content
  // ==========================================================================

  /**
   * Get original source file content with optional line range
   *
   * @param params - File path and optional line range
   * @returns File content with metadata
   */
  async sourceMapGetContent(
    params: z.infer<typeof SourceMapGetContentSchema>
  ): Promise<{
    file: string;
    content: string;
    language: string;
    totalLines: number;
    range?: { start: number; end: number };
  } | null> {
    this.ensureInitialized();

    // Get the source file content from the source map resolver
    const sourceContent = await this.getSourceFileContent(params.file);
    if (!sourceContent) {
      return null;
    }

    const lines = sourceContent.split("\n");
    const totalLines = lines.length;

    let content = sourceContent;
    let range: { start: number; end: number } | undefined;

    if (params.startLine !== undefined || params.endLine !== undefined) {
      const start = Math.max(0, (params.startLine || 1) - 1);
      const end = Math.min(totalLines, params.endLine || totalLines);
      content = lines.slice(start, end).join("\n");
      range = { start: start + 1, end };
    }

    // Detect language from file extension
    const language = this.detectLanguage(params.file);

    return {
      file: params.file,
      content,
      language,
      totalLines,
      range,
    };
  }

  // ==========================================================================
  // Tool 3: source_trace_stack
  // ==========================================================================

  /**
   * Enhance a full stack trace with source map resolution
   *
   * @param params - Stack trace string
   * @returns Original and resolved stack traces
   */
  async sourceTraceStack(
    params: z.infer<typeof SourceTraceStackSchema>
  ): Promise<{
    original: string[];
    resolved: string[];
    frames: ResolvedStackFrame[];
  }> {
    this.ensureInitialized();

    const originalLines = params.stackTrace.split("\n");
    const resolvedLines: string[] = [];
    const frames: ResolvedStackFrame[] = [];

    for (const line of originalLines) {
      // Parse stack frame
      const frame = this.parseStackFrame(line);

      if (!frame) {
        resolvedLines.push(line);
        continue;
      }

      // Resolve with source map
      const resolved = await this.sourceMapResolver.resolveLocation(
        frame.fileName,
        frame.lineNumber,
        frame.columnNumber
      );

      if (resolved) {
        const resolvedLine = this.formatStackFrame({
          functionName: frame.functionName || resolved.name,
          fileName: resolved.file,
          lineNumber: resolved.line,
          columnNumber: resolved.column,
          source: resolved.content,
        });

        resolvedLines.push(resolvedLine);
        frames.push({
          ...frame,
          fileName: resolved.file,
          lineNumber: resolved.line,
          columnNumber: resolved.column,
          source: resolved.content,
          original: frame,
          resolved: true,
        });
      } else {
        resolvedLines.push(line);
        frames.push({
          ...frame,
          original: frame,
          resolved: false,
        });
      }
    }

    return {
      original: originalLines,
      resolved: resolvedLines,
      frames,
    };
  }

  // ==========================================================================
  // Tool 4: source_find_definition
  // ==========================================================================

  /**
   * Find function or class definition in source code
   *
   * @param params - Function/class name and optional file filter
   * @returns Definition location and code snippet
   */
  async sourceFindDefinition(
    params: z.infer<typeof SourceFindDefinitionSchema>
  ): Promise<{
    file: string;
    line: number;
    column: number;
    code: string;
    exports?: string[];
  } | null> {
    this.ensureInitialized();

    // Search through all loaded source files
    const result = await this.searchForDefinition(
      params.functionName,
      params.file
    );

    return result;
  }

  // ==========================================================================
  // Tool 5: source_get_symbols
  // ==========================================================================

  /**
   * List exports, imports, and types from a source file
   *
   * @param params - Source file path
   * @returns Symbols found in the file
   */
  async sourceGetSymbols(
    params: z.infer<typeof SourceGetSymbolsSchema>
  ): Promise<{
    file: string;
    exports: Array<{ name: string; type: string; line: number }>;
    imports: Array<{ name: string; from: string; line: number }>;
    types: Array<{ name: string; kind: string; line: number }>;
  } | null> {
    this.ensureInitialized();

    const content = await this.getSourceFileContent(params.file);
    if (!content) {
      return null;
    }

    const exports = this.extractExports(content);
    const imports = this.extractImports(content);
    const types = this.extractTypes(content);

    return {
      file: params.file,
      exports,
      imports,
      types,
    };
  }

  // ==========================================================================
  // Tool 6: source_map_bundle
  // ==========================================================================

  /**
   * Map a bundle file to all its source files
   *
   * @param params - Bundle file path or URL
   * @returns Bundle info with all source files
   */
  async sourceMapBundle(
    params: z.infer<typeof SourceMapBundleSchema>
  ): Promise<{
    bundle: string;
    sources: string[];
    mappings: Array<{
      source: string;
      generatedLine: number;
      generatedColumn: number;
      originalLine: number;
      originalColumn: number;
    }>;
    size?: number;
  } | null> {
    this.ensureInitialized();

    const bundleInfo = await this.analyzeBundleSourceMap(params.bundlePath);
    return bundleInfo;
  }

  // ==========================================================================
  // Tool 7: source_coverage_map
  // ==========================================================================

  /**
   * Map code coverage data to original source files
   *
   * @param params - V8 coverage data
   * @returns Coverage mapped to source files
   */
  async sourceCoverageMap(
    params: z.infer<typeof SourceCoverageMapSchema>
  ): Promise<{
    covered: Array<{ file: string; lines: number[]; percentage: number }>;
    uncovered: Array<{ file: string; lines: number[]; percentage: number }>;
    percentage: number;
  }> {
    this.ensureInitialized();

    const coverage = await this.mapCoverageToSources(params.coverageData);
    return coverage;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("SourceIntelligenceTools not initialized. Call initialize() first.");
    }
  }

  /**
   * Get source file content from cached source maps
   */
  private async getSourceFileContent(filePath: string): Promise<string | null> {
    return this.sourceMapResolver.getSourceContent(filePath);
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      vue: "vue",
      svelte: "svelte",
      py: "python",
      rb: "ruby",
      go: "go",
      rs: "rust",
      java: "java",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
    };
    return languageMap[ext || ""] || "unknown";
  }

  /**
   * Parse a stack frame line into structured data
   */
  private parseStackFrame(line: string): StackFrame | null {
    // Match common stack trace formats:
    // at functionName (file:line:column)
    // at file:line:column
    // functionName@file:line:column (Firefox)

    const chromeMatch = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/);
    if (chromeMatch) {
      const [, functionName, fileName, lineStr, colStr] = chromeMatch;
      return {
        functionName: functionName?.trim(),
        fileName: fileName.trim(),
        lineNumber: parseInt(lineStr),
        columnNumber: parseInt(colStr),
      };
    }

    const firefoxMatch = line.match(/(.+?)@(.+?):(\d+):(\d+)/);
    if (firefoxMatch) {
      const [, functionName, fileName, lineStr, colStr] = firefoxMatch;
      return {
        functionName: functionName.trim(),
        fileName: fileName.trim(),
        lineNumber: parseInt(lineStr),
        columnNumber: parseInt(colStr),
      };
    }

    return null;
  }

  /**
   * Format a stack frame into a readable string
   */
  private formatStackFrame(frame: StackFrame): string {
    const func = frame.functionName || "<anonymous>";
    const location = `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`;
    let result = `  at ${func} (${location})`;

    if (frame.source) {
      const sourceLine = frame.source.split("\n")[0]?.trim();
      if (sourceLine) {
        result += `\n    > ${sourceLine}`;
      }
    }

    return result;
  }

  /**
   * Search for function/class definition across source files
   */
  private async searchForDefinition(
    name: string,
    fileFilter?: string
  ): Promise<{
    file: string;
    line: number;
    column: number;
    code: string;
    exports?: string[];
  } | null> {
    // Get all source files from loaded source maps
    const allFiles = this.sourceMapResolver.getAllSourceFiles();

    // Filter files if requested
    const filesToSearch = fileFilter
      ? allFiles.filter(f => f.includes(fileFilter))
      : allFiles;

    // Search patterns for definitions
    const patterns = [
      new RegExp(`^\\s*export\\s+function\\s+${name}\\s*\\(`),
      new RegExp(`^\\s*function\\s+${name}\\s*\\(`),
      new RegExp(`^\\s*export\\s+const\\s+${name}\\s*=`),
      new RegExp(`^\\s*const\\s+${name}\\s*=`),
      new RegExp(`^\\s*export\\s+class\\s+${name}\\s+`),
      new RegExp(`^\\s*class\\s+${name}\\s+`),
    ];

    for (const file of filesToSearch) {
      const content = this.sourceMapResolver.getSourceContent(file);
      if (!content) continue;

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            // Extract code context (this line + next 5 lines)
            const codeLines = lines.slice(i, Math.min(i + 6, lines.length));
            const exports = this.extractExports(content);

            return {
              file,
              line: i + 1,
              column: 0,
              code: codeLines.join('\n'),
              exports: exports.map(e => e.name),
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract export statements from source code
   */
  private extractExports(content: string): Array<{ name: string; type: string; line: number }> {
    const exports: Array<{ name: string; type: string; line: number }> = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Match various export patterns
      const patterns = [
        /export\s+(function|class|const|let|var)\s+(\w+)/,
        /export\s+default\s+(function|class)?\s*(\w+)?/,
        /export\s*{\s*([^}]+)\s*}/,
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          if (match[3]) {
            // Named exports
            const names = match[3].split(",").map(n => n.trim().split(/\s+as\s+/)[0]);
            names.forEach(name => {
              exports.push({ name, type: "named", line: index + 1 });
            });
          } else if (match[2]) {
            exports.push({
              name: match[2],
              type: match[1] === "default" ? "default" : match[1] || "unknown",
              line: index + 1
            });
          }
        }
      }
    });

    return exports;
  }

  /**
   * Extract import statements from source code
   */
  private extractImports(content: string): Array<{ name: string; from: string; line: number }> {
    const imports: Array<{ name: string; from: string; line: number }> = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const match = line.match(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
      if (match) {
        const from = match[3];
        if (match[1]) {
          // Named imports
          const names = match[1].split(",").map(n => n.trim().split(/\s+as\s+/)[0]);
          names.forEach(name => {
            imports.push({ name, from, line: index + 1 });
          });
        } else if (match[2]) {
          // Default import
          imports.push({ name: match[2], from, line: index + 1 });
        }
      }
    });

    return imports;
  }

  /**
   * Extract type definitions from source code
   */
  private extractTypes(content: string): Array<{ name: string; kind: string; line: number }> {
    const types: Array<{ name: string; kind: string; line: number }> = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Match TypeScript type definitions
      const patterns = [
        { regex: /type\s+(\w+)\s*=/, kind: "type" },
        { regex: /interface\s+(\w+)/, kind: "interface" },
        { regex: /enum\s+(\w+)/, kind: "enum" },
      ];

      for (const { regex, kind } of patterns) {
        const match = line.match(regex);
        if (match) {
          types.push({ name: match[1], kind, line: index + 1 });
        }
      }
    });

    return types;
  }

  /**
   * Analyze bundle source map and extract all source files
   */
  private async analyzeBundleSourceMap(bundlePath: string): Promise<{
    bundle: string;
    sources: string[];
    mappings: Array<{
      source: string;
      generatedLine: number;
      generatedColumn: number;
      originalLine: number;
      originalColumn: number;
    }>;
    size?: number;
  } | null> {
    // Get the source map consumer for this bundle
    const consumer = await this.sourceMapResolver.getSourceMapConsumer(bundlePath);
    if (!consumer) {
      return null;
    }

    // Get all source files - need to access via any cast as sources is not exposed in types
    const sources = (consumer as any).sources as string[];

    // Extract sample mappings (first 20 mappings)
    const mappings: Array<{
      source: string;
      generatedLine: number;
      generatedColumn: number;
      originalLine: number;
      originalColumn: number;
    }> = [];

    // Sample some mappings
    let count = 0;
    consumer.eachMapping((mapping) => {
      if (count < 20 && mapping.source) {
        mappings.push({
          source: mapping.source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
        });
        count++;
      }
    });

    return {
      bundle: bundlePath,
      sources: sources,
      mappings,
      size: sources.length,
    };
  }

  /**
   * Map V8 coverage data to original source files
   */
  private async mapCoverageToSources(coverageData: Record<string, any>): Promise<{
    covered: Array<{ file: string; lines: number[]; percentage: number }>;
    uncovered: Array<{ file: string; lines: number[]; percentage: number }>;
    percentage: number;
  }> {
    // V8 coverage data format:
    // { url: string, ranges: Array<{ start, end, count }> }

    const fileCoverage = new Map<string, { covered: Set<number>; total: Set<number> }>();

    // Process coverage data
    if (Array.isArray(coverageData)) {
      for (const entry of coverageData) {
        const url = entry.url;
        const ranges = entry.functions?.[0]?.ranges || entry.ranges || [];

        for (const range of ranges) {
          // Convert byte offsets to line numbers (simplified)
          // In real implementation, you'd use the actual source text
          const startLine = Math.floor(range.startOffset / 80) + 1; // Rough approximation
          const endLine = Math.floor(range.endOffset / 80) + 1;
          const isCovered = range.count > 0;

          // Resolve to original source
          for (let line = startLine; line <= endLine; line++) {
            const resolved = await this.sourceMapResolver.resolveLocation(url, line, 0);
            if (resolved) {
              if (!fileCoverage.has(resolved.file)) {
                fileCoverage.set(resolved.file, { covered: new Set(), total: new Set() });
              }
              const coverage = fileCoverage.get(resolved.file)!;
              coverage.total.add(resolved.line);
              if (isCovered) {
                coverage.covered.add(resolved.line);
              }
            }
          }
        }
      }
    }

    // Convert to output format
    const covered: Array<{ file: string; lines: number[]; percentage: number }> = [];
    const uncovered: Array<{ file: string; lines: number[]; percentage: number }> = [];
    let totalCovered = 0;
    let totalLines = 0;

    for (const [file, coverage] of Array.from(fileCoverage.entries())) {
      const coveredLines: number[] = Array.from(coverage.covered).sort((a: number, b: number) => a - b);
      const totalFileLines = coverage.total.size;
      const percentage = totalFileLines > 0 ? (coveredLines.length / totalFileLines) * 100 : 0;

      totalCovered += coveredLines.length;
      totalLines += totalFileLines;

      if (percentage > 0) {
        covered.push({ file, lines: coveredLines, percentage });
      }

      const uncoveredLines: number[] = Array.from(coverage.total).filter((l: number) => !coverage.covered.has(l)).sort((a: number, b: number) => a - b);
      if (uncoveredLines.length > 0) {
        uncovered.push({
          file,
          lines: uncoveredLines,
          percentage: 100 - percentage,
        });
      }
    }

    const overallPercentage = totalLines > 0 ? (totalCovered / totalLines) * 100 : 0;

    return {
      covered,
      uncovered,
      percentage: overallPercentage,
    };
  }

  /**
   * Cleanup and destroy resources
   */
  async destroy(): Promise<void> {
    if (this.sourceMapResolver) {
      await this.sourceMapResolver.destroy();
    }
    if (this.buildManager) {
      this.buildManager.clear();
    }
    this.initialized = false;
  }
}

// ============================================================================
// MCP Tool Definitions
// ============================================================================

/**
 * MCP tool definitions for registration with the server
 */
export const SOURCE_INTELLIGENCE_TOOL_DEFINITIONS = [
  {
    name: "source_map_resolve",
    description: "Resolve a minified JavaScript location to its original source file, line, and column using source maps",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the minified JavaScript file"
        },
        line: {
          type: "number",
          description: "Line number in minified file (1-indexed)"
        },
        column: {
          type: "number",
          description: "Column number in minified file (0-indexed)"
        },
      },
      required: ["url", "line", "column"],
    },
  },
  {
    name: "source_map_get_content",
    description: "Get the content of an original source file from source maps, optionally filtered by line range",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Original source file path from source map"
        },
        startLine: {
          type: "number",
          description: "Start line number (1-indexed, optional)"
        },
        endLine: {
          type: "number",
          description: "End line number (1-indexed, optional)"
        },
      },
      required: ["file"],
    },
  },
  {
    name: "source_trace_stack",
    description: "Enhance a complete error stack trace by resolving all frames to their original source locations using source maps",
    inputSchema: {
      type: "object",
      properties: {
        stackTrace: {
          type: "string",
          description: "Full stack trace string to resolve"
        },
      },
      required: ["stackTrace"],
    },
  },
  {
    name: "source_find_definition",
    description: "Find the definition of a function or class in the original source code",
    inputSchema: {
      type: "object",
      properties: {
        functionName: {
          type: "string",
          description: "Name of the function or class to find"
        },
        file: {
          type: "string",
          description: "Specific source file to search in (optional)"
        },
      },
      required: ["functionName"],
    },
  },
  {
    name: "source_get_symbols",
    description: "List all exports, imports, and type definitions from an original source file",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Source file path to analyze"
        },
      },
      required: ["file"],
    },
  },
  {
    name: "source_map_bundle",
    description: "Map a JavaScript bundle file to all of its original source files and show the relationship",
    inputSchema: {
      type: "object",
      properties: {
        bundlePath: {
          type: "string",
          description: "Path or URL to the bundle file"
        },
      },
      required: ["bundlePath"],
    },
  },
  {
    name: "source_coverage_map",
    description: "Map V8 code coverage data from minified bundles back to original source files for accurate coverage reporting",
    inputSchema: {
      type: "object",
      properties: {
        coverageData: {
          type: "object",
          description: "V8 coverage data object"
        },
      },
      required: ["coverageData"],
    },
  },
];

// ============================================================================
// Exported Tool Handler Functions
// ============================================================================

// Global instance to maintain state across tool calls
let toolsInstance: SourceIntelligenceTools | null = null;

/**
 * Get or create the SourceIntelligenceTools instance
 */
async function getToolsInstance(page: Page): Promise<SourceIntelligenceTools> {
  if (!toolsInstance) {
    toolsInstance = new SourceIntelligenceTools();
    await toolsInstance.initialize(page);
  }
  return toolsInstance;
}

/**
 * Handler for source_map_resolve tool
 */
export async function sourceMapResolve(
  page: Page,
  params: z.infer<typeof SourceMapResolveSchema>
): Promise<any> {
  const tools = await getToolsInstance(page);
  const result = await tools.sourceMapResolve(params);

  if (!result) {
    return {
      success: false,
      message: `No source map found for ${params.url} at ${params.line}:${params.column}`,
      minified: {
        url: params.url,
        line: params.line,
        column: params.column,
      },
    };
  }

  return {
    success: true,
    minified: {
      url: params.url,
      line: params.line,
      column: params.column,
    },
    original: result,
  };
}

/**
 * Handler for source_map_get_content tool
 */
export async function sourceMapGetContent(
  page: Page,
  params: z.infer<typeof SourceMapGetContentSchema>
): Promise<any> {
  const tools = await getToolsInstance(page);
  const result = await tools.sourceMapGetContent(params);

  if (!result) {
    return {
      success: false,
      message: `Source file not found: ${params.file}`,
      file: params.file,
    };
  }

  return {
    success: true,
    ...result,
  };
}

/**
 * Handler for source_trace_stack tool
 */
export async function sourceTraceStack(
  page: Page,
  params: z.infer<typeof SourceTraceStackSchema>
): Promise<any> {
  const tools = await getToolsInstance(page);
  const result = await tools.sourceTraceStack(params);

  return {
    success: true,
    ...result,
    summary: {
      totalFrames: result.frames.length,
      resolvedFrames: result.frames.filter((f: any) => f.resolved).length,
      unresolvedFrames: result.frames.filter((f: any) => !f.resolved).length,
    },
  };
}

/**
 * Handler for source_find_definition tool
 */
export async function sourceFindDefinition(
  page: Page,
  params: z.infer<typeof SourceFindDefinitionSchema>
): Promise<any> {
  const tools = await getToolsInstance(page);
  const result = await tools.sourceFindDefinition(params);

  if (!result) {
    return {
      success: false,
      message: `Definition not found for: ${params.functionName}${params.file ? ` in ${params.file}` : ''}`,
      functionName: params.functionName,
    };
  }

  return {
    success: true,
    functionName: params.functionName,
    definition: result,
  };
}

/**
 * Handler for source_get_symbols tool
 */
export async function sourceGetSymbols(
  page: Page,
  params: z.infer<typeof SourceGetSymbolsSchema>
): Promise<any> {
  const tools = await getToolsInstance(page);
  const result = await tools.sourceGetSymbols(params);

  if (!result) {
    return {
      success: false,
      message: `Source file not found: ${params.file}`,
      file: params.file,
    };
  }

  return {
    success: true,
    ...result,
    summary: {
      totalExports: result.exports.length,
      totalImports: result.imports.length,
      totalTypes: result.types.length,
    },
  };
}

/**
 * Handler for source_map_bundle tool
 */
export async function sourceMapBundle(
  page: Page,
  params: z.infer<typeof SourceMapBundleSchema>
): Promise<any> {
  const tools = await getToolsInstance(page);
  const result = await tools.sourceMapBundle(params);

  if (!result) {
    return {
      success: false,
      message: `No source map found for bundle: ${params.bundlePath}`,
      bundle: params.bundlePath,
    };
  }

  return {
    success: true,
    ...result,
    summary: {
      totalSources: result.sources.length,
      sampleMappings: result.mappings.length,
    },
  };
}

/**
 * Handler for source_coverage_map tool
 */
export async function sourceCoverageMap(
  page: Page,
  params: z.infer<typeof SourceCoverageMapSchema>
): Promise<any> {
  const tools = await getToolsInstance(page);
  const result = await tools.sourceCoverageMap(params);

  return {
    success: true,
    ...result,
    summary: {
      totalFiles: result.covered.length + result.uncovered.length,
      coveredFiles: result.covered.length,
      uncoveredFiles: result.uncovered.length,
      overallPercentage: result.percentage.toFixed(2) + '%',
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export default SOURCE_INTELLIGENCE_TOOL_DEFINITIONS;
