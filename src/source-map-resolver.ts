import { Page } from 'playwright';
import { SourceMapConsumer, RawSourceMap } from 'source-map';

/**
 * Represents a location in the original source code
 */
export interface SourceLocation {
  file: string; // Original source file path
  line: number; // Original line number
  column: number; // Original column number
  name?: string; // Original symbol name
  content?: string; // Source code snippet (±3 lines)
}

/**
 * Cache entry for parsed source maps
 */
interface SourceMapCacheEntry {
  consumer: SourceMapConsumer;
  sourceContent: Map<string, string[]>; // Split by lines for fast lookup
  timestamp: number;
}

/**
 * LRU Cache implementation for source maps
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);
    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Resolves minified JavaScript locations back to original source files
 * using source maps.
 */
export class SourceMapResolver {
  private sourceMapCache: LRUCache<string, SourceMapCacheEntry>;
  private page: Page | null = null;
  private initialized = false;
  private sourceMapUrls = new Map<string, string>(); // JS URL -> source map URL

  constructor(cacheSize = 50) {
    this.sourceMapCache = new LRUCache(cacheSize);
  }

  /**
   * Initialize the resolver with a Playwright page.
   * Sets up request interception to discover and fetch source maps.
   */
  async initialize(page: Page): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.page = page;

    // Intercept responses to discover source map URLs
    page.on('response', async response => {
      try {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';

        // Only process JavaScript files
        if (!contentType.includes('javascript') && !url.endsWith('.js')) {
          return;
        }

        // Check for source map header
        const sourceMapHeader = response.headers()['sourcemappingurl'];
        if (sourceMapHeader) {
          const sourceMapUrl = this.resolveSourceMapUrl(url, sourceMapHeader);
          this.sourceMapUrls.set(url, sourceMapUrl);
          return;
        }

        // Check for inline source map comment in the response body
        const text = await response.text().catch(() => '');
        const inlineMatch = text.match(/\/\/[@#]\s*sourceMappingURL=(.+)/);
        if (inlineMatch) {
          const sourceMapUrl = this.resolveSourceMapUrl(url, inlineMatch[1].trim());
          this.sourceMapUrls.set(url, sourceMapUrl);
        }
      } catch (error) {
        // Silently ignore errors during source map discovery
        // We don't want to break the page load
      }
    });

    this.initialized = true;
  }

  /**
   * Resolve a location in minified code to its original source location.
   *
   * @param url - The URL of the minified JavaScript file
   * @param line - Line number in the minified file (1-indexed)
   * @param column - Column number in the minified file (0-indexed)
   * @returns Original source location or null if mapping fails
   */
  async resolveLocation(url: string, line: number, column: number): Promise<SourceLocation | null> {
    if (!this.initialized || !this.page) {
      throw new Error('SourceMapResolver not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    try {
      // Get or load the source map
      const cacheEntry = await this.getOrLoadSourceMap(url);
      if (!cacheEntry) {
        return null;
      }

      const { consumer, sourceContent } = cacheEntry;

      // Look up the original position
      const originalPosition = consumer.originalPositionFor({
        line,
        column,
      });

      if (!originalPosition.source) {
        return null;
      }

      // Extract source context (±3 lines)
      const content = this.extractSourceContext(
        sourceContent,
        originalPosition.source,
        originalPosition.line || 1
      );

      const result: SourceLocation = {
        file: originalPosition.source,
        line: originalPosition.line || 1,
        column: originalPosition.column || 0,
        name: originalPosition.name || undefined,
        content,
      };

      // Performance check - warn if slow
      const elapsed = Date.now() - startTime;
      if (elapsed > 100) {
        console.warn(`SourceMapResolver: Slow resolution (${elapsed}ms) for ${url}`);
      }

      return result;
    } catch (error) {
      console.error(`SourceMapResolver: Failed to resolve location in ${url}:`, error);
      return null;
    }
  }

  /**
   * Get source map from cache or load it
   */
  private async getOrLoadSourceMap(url: string): Promise<SourceMapCacheEntry | null> {
    // Check cache first
    if (this.sourceMapCache.has(url)) {
      return this.sourceMapCache.get(url)!;
    }

    // Find the source map URL
    const sourceMapUrl = this.sourceMapUrls.get(url);
    if (!sourceMapUrl) {
      return null;
    }

    try {
      // Fetch and parse the source map
      const sourceMapData = await this.fetchSourceMap(sourceMapUrl);
      if (!sourceMapData) {
        return null;
      }

      const consumer = await new SourceMapConsumer(sourceMapData);

      // Extract and process source content
      const sourceContent = new Map<string, string[]>();
      const sources = consumer.sources;

      for (const source of sources) {
        const content = consumer.sourceContentFor(source, true);
        if (content) {
          // Split into lines for fast lookup
          sourceContent.set(source, content.split('\n'));
        }
      }

      const cacheEntry: SourceMapCacheEntry = {
        consumer,
        sourceContent,
        timestamp: Date.now(),
      };

      this.sourceMapCache.set(url, cacheEntry);
      return cacheEntry;
    } catch (error) {
      console.error(`SourceMapResolver: Failed to load source map for ${url}:`, error);
      return null;
    }
  }

  /**
   * Fetch a source map from a URL
   */
  private async fetchSourceMap(url: string): Promise<RawSourceMap | null> {
    if (!this.page) {
      return null;
    }

    try {
      // Handle data URLs (inline source maps)
      if (url.startsWith('data:')) {
        const base64Match = url.match(/base64,(.+)/);
        if (base64Match) {
          const decoded = Buffer.from(base64Match[1], 'base64').toString('utf-8');
          return JSON.parse(decoded);
        }
        return null;
      }

      // Fetch via Playwright's context to maintain cookies/headers
      const response = await this.page.context().request.get(url);
      if (!response.ok()) {
        return null;
      }

      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error(`SourceMapResolver: Failed to fetch source map from ${url}:`, error);
      return null;
    }
  }

  /**
   * Resolve a source map URL relative to the JavaScript file URL
   */
  private resolveSourceMapUrl(jsUrl: string, sourceMapPath: string): string {
    // Handle absolute URLs
    if (sourceMapPath.startsWith('http://') || sourceMapPath.startsWith('https://')) {
      return sourceMapPath;
    }

    // Handle data URLs
    if (sourceMapPath.startsWith('data:')) {
      return sourceMapPath;
    }

    // Handle protocol-relative URLs
    if (sourceMapPath.startsWith('//')) {
      const protocol = jsUrl.split('://')[0];
      return `${protocol}:${sourceMapPath}`;
    }

    // Handle absolute paths
    if (sourceMapPath.startsWith('/')) {
      const urlObj = new URL(jsUrl);
      return `${urlObj.protocol}//${urlObj.host}${sourceMapPath}`;
    }

    // Handle relative paths
    const jsUrlObj = new URL(jsUrl);
    const basePath = jsUrlObj.pathname.substring(0, jsUrlObj.pathname.lastIndexOf('/'));
    return `${jsUrlObj.protocol}//${jsUrlObj.host}${basePath}/${sourceMapPath}`;
  }

  /**
   * Extract source code context around a specific line
   */
  private extractSourceContext(
    sourceContent: Map<string, string[]>,
    sourcePath: string,
    targetLine: number,
    contextLines = 3
  ): string | undefined {
    const lines = sourceContent.get(sourcePath);
    if (!lines) {
      return undefined;
    }

    const startLine = Math.max(0, targetLine - contextLines - 1);
    const endLine = Math.min(lines.length, targetLine + contextLines);

    const contextLines_array = lines.slice(startLine, endLine);
    return contextLines_array.join('\n');
  }

  /**
   * Clear all cached source maps
   */
  clearCache(): void {
    this.sourceMapCache.clear();
    this.sourceMapUrls.clear();
  }

  /**
   * Get source file content from any loaded source map
   * Searches through all cached source maps to find the file
   */
  getSourceContent(filePath: string): string | null {
    // Search through all cached source maps
    for (const [, cacheEntry] of (this.sourceMapCache as any).cache) {
      const content = cacheEntry.sourceContent.get(filePath);
      if (content) {
        return content.join('\n');
      }
    }
    return null;
  }

  /**
   * Get all source files from loaded source maps
   */
  getAllSourceFiles(): string[] {
    const files = new Set<string>();
    for (const [, cacheEntry] of (this.sourceMapCache as any).cache) {
      for (const [filePath] of cacheEntry.sourceContent) {
        files.add(filePath);
      }
    }
    return Array.from(files);
  }

  /**
   * Get source map consumer for a specific URL
   * Used for advanced source map operations
   */
  async getSourceMapConsumer(url: string): Promise<SourceMapConsumer | null> {
    const cacheEntry = await this.getOrLoadSourceMap(url);
    return cacheEntry ? cacheEntry.consumer : null;
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.clearCache();
    this.page = null;
    this.initialized = false;
  }
}
