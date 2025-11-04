/**
 * WebSee Source Intelligence Layer
 * Production-ready browser automation with source tracking
 *
 * @packageDocumentation
 */

import { Page } from 'playwright';
import { SourceMapResolver } from './source-map-resolver.js';
import { ComponentTracker } from './component-tracker.js';
import { NetworkTracer } from './network-tracer.js';
import { BuildArtifactManager } from './build-artifact-manager.js';

export interface SourceIntelligenceOptions {
  enableSourceMaps?: boolean;
  enableComponentTracking?: boolean;
  enableNetworkTracing?: boolean;
  enableBuildAnalysis?: boolean;
  sourceMapCacheSize?: number;
  projectRoot?: string;
}

export class SourceIntelligenceLayer {
  private sourceMapResolver: SourceMapResolver | null = null;
  private componentTracker: ComponentTracker | null = null;
  private networkTracer: NetworkTracer | null = null;
  private buildManager: BuildArtifactManager | null = null;

  private options: SourceIntelligenceOptions;

  constructor(options: SourceIntelligenceOptions = {}) {
    this.options = {
      enableSourceMaps: true,
      enableComponentTracking: true,
      enableNetworkTracing: true,
      enableBuildAnalysis: true,
      sourceMapCacheSize: 50,
      projectRoot: process.cwd(),
      ...options,
    };
  }

  /**
   * Initialize all intelligence agents
   */
  async initialize(page: Page): Promise<void> {
    // Initialize Source Map Resolver
    if (this.options.enableSourceMaps) {
      this.sourceMapResolver = new SourceMapResolver(this.options.sourceMapCacheSize);
      await this.sourceMapResolver.initialize(page);
      console.log('✅ Source Map Resolver initialized');
    }

    // Initialize Component Tracker
    if (this.options.enableComponentTracking) {
      this.componentTracker = new ComponentTracker();
      await this.componentTracker.initialize(page);
      console.log('✅ Component Tracker initialized');
    }

    // Initialize Network Tracer
    if (this.options.enableNetworkTracing) {
      this.networkTracer = new NetworkTracer();
      await this.networkTracer.initialize(page);
      console.log('✅ Network Tracer initialized');
    }

    // Initialize Build Artifact Manager
    if (this.options.enableBuildAnalysis) {
      this.buildManager = new BuildArtifactManager(this.options.projectRoot);
      await this.buildManager.loadBuildArtifacts().catch(() => {
        console.warn('⚠️ Build artifacts not found - build analysis disabled');
      });
    }
  }

  /**
   * Resolve a minified location to original source
   */
  async resolveSourceLocation(
    url: string,
    line: number,
    column: number
  ): Promise<{
    file: string;
    line: number;
    column: number;
    content?: string;
  } | null> {
    if (!this.sourceMapResolver) return null;
    return this.sourceMapResolver.resolveLocation(url, line, column);
  }

  /**
   * Get component at a specific element
   */
  async getComponentAtElement(selector: string): Promise<any> {
    if (!this.componentTracker) return null;
    return this.componentTracker.getComponentAtElement(selector);
  }

  /**
   * Get network traces for analysis
   */
  getNetworkTraces(): any[] {
    if (!this.networkTracer) return [];
    return this.networkTracer.getTraces();
  }

  /**
   * Get component tree
   */
  async getComponentTree(): Promise<any[]> {
    if (!this.componentTracker) return [];
    return this.componentTracker.getComponentTree();
  }

  /**
   * Get network traces for a specific URL pattern
   */
  getNetworkTracesForUrl(urlPattern: string): any[] {
    if (!this.networkTracer) return [];
    return this.networkTracer.getTracesForUrl(urlPattern);
  }

  /**
   * Find module info for a file
   */
  findBuildModule(filePath: string): any {
    if (!this.buildManager) return null;
    return this.buildManager.findModule(filePath);
  }

  /**
   * Get comprehensive intelligence for an error
   */
  async getErrorIntelligence(error: Error): Promise<{
    originalStack?: string[];
    components?: any[];
    networkActivity?: any[];
    buildInfo?: any;
  }> {
    const result: any = {};

    // Parse and resolve stack trace
    if (this.sourceMapResolver && error.stack) {
      const stackLines = error.stack.split('\n');
      const resolvedStack: string[] = [];

      for (const line of stackLines) {
        const match = line.match(/at .* \((.*):(\d+):(\d+)\)/);
        if (match) {
          const [, url, lineStr, colStr] = match;
          const resolved = await this.sourceMapResolver.resolveLocation(
            url,
            parseInt(lineStr),
            parseInt(colStr)
          );

          if (resolved) {
            resolvedStack.push(`at ${resolved.file}:${resolved.line}:${resolved.column}`);
            if (resolved.content) {
              resolvedStack.push(`  > ${resolved.content.trim()}`);
            }
          } else {
            resolvedStack.push(line);
          }
        } else {
          resolvedStack.push(line);
        }
      }

      result.originalStack = resolvedStack;
    }

    // Add component context
    if (this.componentTracker) {
      result.components = await this.componentTracker.getComponentTree();
    }

    // Add recent network activity
    if (this.networkTracer) {
      result.networkActivity = this.networkTracer.getTraces().slice(-10);
    }

    // Add build module info
    if (this.buildManager && error.stack) {
      const fileMatch = error.stack.match(/\/([\w\-\.]+\.[jt]sx?):/);
      if (fileMatch) {
        result.buildInfo = this.buildManager.findModule(fileMatch[1]);
      }
    }

    return result;
  }

  /**
   * Get summary of all intelligence
   */
  getSummary(): {
    sourceMaps: { loaded: boolean; cacheSize?: number };
    components: { enabled: boolean; count?: number };
    network: { enabled: boolean; traces?: number };
    build: { enabled: boolean; modules?: number };
  } {
    return {
      sourceMaps: {
        loaded: !!this.sourceMapResolver,
        cacheSize: this.sourceMapResolver ? this.options.sourceMapCacheSize : undefined,
      },
      components: {
        enabled: this.options.enableComponentTracking || false,
        // count: this.componentTracker?.getComponentCount()
      },
      network: {
        enabled: this.options.enableNetworkTracing || false,
        // traces: this.networkTracer?.getTraces().length
      },
      build: {
        enabled: this.options.enableBuildAnalysis || false,
        // modules: this.buildManager?.getSummary().totalModules
      },
    };
  }

  /**
   * Cleanup and destroy all agents
   */
  async destroy(): Promise<void> {
    if (this.sourceMapResolver) {
      await this.sourceMapResolver.destroy();
    }
    if (this.componentTracker) {
      // Component tracker cleanup if needed
      this.componentTracker = null;
    }
    if (this.networkTracer) {
      await this.networkTracer.destroy();
    }
    if (this.buildManager) {
      this.buildManager.clear();
    }
  }
}

// Export all agents for individual use
export { SourceMapResolver };
export { ComponentTracker } from './component-tracker.js';
export { NetworkTracer } from './network-tracer.js';
export { BuildArtifactManager } from './build-artifact-manager.js';
