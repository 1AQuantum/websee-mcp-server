/**
 * Component Intelligence Tools for WebSee MCP Server
 *
 * Provides granular component inspection tools for React, Vue, and Angular applications.
 * These tools integrate with the ComponentTracker to provide detailed component analysis.
 *
 * @module component-intelligence-tools
 */

import { Page } from 'playwright';
import { z } from 'zod';
import { ComponentTracker, ComponentInfo } from '../component-tracker.js';

// ============================================================================
// Zod Schemas for Tool Parameters
// ============================================================================

export const ComponentTreeSchema = z.object({
  url: z.string().url().describe('The URL of the page to analyze'),
  includeDepth: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include depth information for each component'),
  filterFramework: z
    .enum(['react', 'vue', 'angular', 'svelte', 'all'])
    .optional()
    .default('all')
    .describe('Filter components by framework'),
});

export const ComponentGetPropsSchema = z.object({
  url: z.string().url().describe('The page URL'),
  selector: z.string().describe('CSS selector for the component'),
});

export const ComponentGetStateSchema = z.object({
  url: z.string().url().describe('The page URL'),
  selector: z.string().describe('CSS selector for the component'),
});

export const ComponentFindByNameSchema = z.object({
  url: z.string().url().describe('The page URL'),
  componentName: z.string().describe('Name of the component to find (case-sensitive)'),
  includeProps: z.boolean().optional().default(true).describe('Include props in results'),
  includeState: z.boolean().optional().default(true).describe('Include state in results'),
});

export const ComponentGetSourceSchema = z.object({
  url: z.string().url().describe('The page URL'),
  selector: z.string().describe('CSS selector for the component'),
});

export const ComponentTrackRendersSchema = z.object({
  url: z.string().url().describe('The page URL'),
  selector: z.string().describe('CSS selector for the component to track'),
  duration: z
    .number()
    .min(1000)
    .max(60000)
    .default(5000)
    .describe('Duration to track renders in milliseconds (1s-60s)'),
  captureReasons: z
    .boolean()
    .optional()
    .default(true)
    .describe('Attempt to capture re-render reasons'),
});

export const ComponentGetContextSchema = z.object({
  url: z.string().url().describe('The page URL'),
  selector: z.string().describe('CSS selector for the component'),
});

export const ComponentGetHooksSchema = z.object({
  url: z.string().url().describe('The page URL'),
  selector: z.string().describe('CSS selector for the React component'),
});

// ============================================================================
// Type Definitions
// ============================================================================

interface ComponentTreeNode {
  name: string;
  type: string;
  depth: number;
  children: ComponentTreeNode[];
  props?: Record<string, any>;
  state?: Record<string, any>;
  source?: {
    file: string;
    line?: number;
    column?: number;
  };
}

interface ComponentInstance {
  selector: string;
  props: Record<string, any>;
  state?: Record<string, any>;
  domId?: string;
}

interface RenderEvent {
  timestamp: number;
  reason?: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
  duration?: number;
}

interface ContextValue {
  name: string;
  value: any;
  provider?: string;
}

interface HookInfo {
  type: string;
  value: any;
  dependencies?: any[];
  index: number;
}

// ============================================================================
// Tool Implementation Functions
// ============================================================================

/**
 * Get full component hierarchy as a tree structure
 */
export async function componentTree(
  page: Page,
  params: z.infer<typeof ComponentTreeSchema>
): Promise<{ components: ComponentTreeNode[]; totalCount: number; frameworks: string[] }> {
  const tracker = new ComponentTracker();

  try {
    await tracker.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const allComponents = await tracker.getComponentTree();

    // Filter by framework if specified
    const filteredComponents =
      params.filterFramework === 'all'
        ? allComponents
        : allComponents.filter((c: ComponentInfo) => c.type === params.filterFramework);

    // Build tree structure with depth calculation
    const componentMap = new Map<string, ComponentInfo>();
    filteredComponents.forEach((c: ComponentInfo) => componentMap.set(c.name, c));

    const buildTree = (comp: ComponentInfo, depth = 0): ComponentTreeNode => {
      const node: ComponentTreeNode = {
        name: comp.name,
        type: comp.type,
        depth,
        children: [],
        props: comp.props,
        state: comp.state,
        source: comp.source
          ? {
              file: comp.source.file,
              line: comp.source.line,
              column: comp.source.column,
            }
          : undefined,
      };

      // Build children recursively
      if (comp.children && comp.children.length > 0) {
        node.children = comp.children
          .map(childName => componentMap.get(childName))
          .filter((child): child is ComponentInfo => child !== undefined)
          .map(child => buildTree(child, depth + 1));
      }

      return node;
    };

    // Find root components (those without parents)
    const rootComponents = filteredComponents.filter((c: ComponentInfo) => !c.parent);
    const tree = rootComponents.map(c => buildTree(c));

    // Get unique frameworks
    const frameworks = Array.from(new Set(allComponents.map((c: ComponentInfo) => c.type)));

    return {
      components: tree,
      totalCount: filteredComponents.length,
      frameworks,
    };
  } finally {
    // Cleanup is handled by page lifecycle
  }
}

/**
 * Get component props only
 */
export async function componentGetProps(
  page: Page,
  params: z.infer<typeof ComponentGetPropsSchema>
): Promise<{ componentName: string; props: Record<string, any> }> {
  const tracker = new ComponentTracker();

  try {
    await tracker.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const component = await tracker.getComponentAtElement(params.selector);

    if (!component) {
      throw new Error(`No component found at selector: ${params.selector}`);
    }

    return {
      componentName: component.name,
      props: component.props || {},
    };
  } finally {
    // Cleanup is handled by page lifecycle
  }
}

/**
 * Get component state only
 */
export async function componentGetState(
  page: Page,
  params: z.infer<typeof ComponentGetStateSchema>
): Promise<{ componentName: string; state: Record<string, any> | null }> {
  const tracker = new ComponentTracker();

  try {
    await tracker.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const component = await tracker.getComponentAtElement(params.selector);

    if (!component) {
      throw new Error(`No component found at selector: ${params.selector}`);
    }

    return {
      componentName: component.name,
      state: component.state || null,
    };
  } finally {
    // Cleanup is handled by page lifecycle
  }
}

/**
 * Find all instances of a component by name
 */
export async function componentFindByName(
  page: Page,
  params: z.infer<typeof ComponentFindByNameSchema>
): Promise<{ instances: ComponentInstance[]; count: number }> {
  const tracker = new ComponentTracker();

  try {
    await tracker.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const allComponents = await tracker.getComponentTree();
    const matchingComponents = allComponents.filter(
      (c: ComponentInfo) => c.name === params.componentName
    );

    const instances: ComponentInstance[] = matchingComponents.map((comp: ComponentInfo) => {
      const instance: ComponentInstance = {
        selector: comp.domNodes[0] ? `#${comp.domNodes[0]}` : 'unknown',
        domId: comp.domNodes[0],
        props: params.includeProps ? comp.props || {} : {},
      };

      if (params.includeState && comp.state) {
        instance.state = comp.state;
      }

      return instance;
    });

    return {
      instances,
      count: instances.length,
    };
  } finally {
    // Cleanup is handled by page lifecycle
  }
}

/**
 * Map component to source file
 */
export async function componentGetSource(
  page: Page,
  params: z.infer<typeof ComponentGetSourceSchema>
): Promise<{ file: string; line?: number; column?: number; framework: string }> {
  const tracker = new ComponentTracker();

  try {
    await tracker.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const component = await tracker.getComponentAtElement(params.selector);

    if (!component) {
      throw new Error(`No component found at selector: ${params.selector}`);
    }

    if (!component.source) {
      return {
        file: 'unknown',
        framework: component.type,
      };
    }

    return {
      file: component.source.file,
      line: component.source.line,
      column: component.source.column,
      framework: component.type,
    };
  } finally {
    // Cleanup is handled by page lifecycle
  }
}

/**
 * Track component re-renders over time
 */
export async function componentTrackRenders(
  page: Page,
  params: z.infer<typeof ComponentTrackRendersSchema>
): Promise<{
  componentName: string;
  renders: RenderEvent[];
  totalRenders: number;
  averageInterval: number;
}> {
  const tracker = new ComponentTracker();

  try {
    await tracker.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    // Get the component to track
    const component = await tracker.getComponentAtElement(params.selector);
    if (!component) {
      throw new Error(`No component found at selector: ${params.selector}`);
    }

    // Inject render tracking
    await page.evaluate(
      ({ captureReasons }) => {
        const renderEvents: any[] = [];

        // Setup React DevTools hook monitoring if available
        const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook) {
          const originalOnCommit = hook.onCommitFiberRoot;
          hook.onCommitFiberRoot = function (...args: any[]) {
            const timestamp = performance.now();
            renderEvents.push({
              timestamp,
              reason: captureReasons ? 'commit' : undefined,
            });

            if (originalOnCommit) {
              return originalOnCommit.apply(this, args);
            }
          };
        }

        // Store events globally for retrieval
        (window as any).__websee_render_events = renderEvents;
      },
      { captureReasons: params.captureReasons }
    );

    // Wait for the specified duration
    await page.waitForTimeout(params.duration);

    // Retrieve render events
    const events = await page.evaluate(() => {
      return (window as any).__websee_render_events || [];
    });

    // Process events
    const processedRenders: RenderEvent[] = events.map((event: any, index: number) => ({
      timestamp: event.timestamp,
      reason: event.reason,
      duration: index > 0 ? event.timestamp - events[index - 1].timestamp : undefined,
    }));

    // Calculate average interval
    const intervals = processedRenders
      .map(r => r.duration)
      .filter((d): d is number => d !== undefined);
    const averageInterval =
      intervals.length > 0 ? intervals.reduce((sum, d) => sum + d, 0) / intervals.length : 0;

    return {
      componentName: component.name,
      renders: processedRenders,
      totalRenders: processedRenders.length,
      averageInterval,
    };
  } finally {
    // Cleanup tracking hooks
    await page
      .evaluate(() => {
        delete (window as any).__websee_render_events;

        // Restore original hook if modified
        const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook && hook.__websee_original_onCommit) {
          hook.onCommitFiberRoot = hook.__websee_original_onCommit;
          delete hook.__websee_original_onCommit;
        }
      })
      .catch(() => {
        // Ignore errors during cleanup
      });
  }
}

/**
 * Get React context values for a component
 */
export async function componentGetContext(
  page: Page,
  params: z.infer<typeof ComponentGetContextSchema>
): Promise<{ contexts: ContextValue[] }> {
  const tracker = new ComponentTracker();

  try {
    await tracker.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const component = await tracker.getComponentAtElement(params.selector);

    if (!component) {
      throw new Error(`No component found at selector: ${params.selector}`);
    }

    // Extract context values from the component
    const contexts = await page.evaluate(selector => {
      const element = document.querySelector(selector);
      if (!element) return [];

      const contexts: ContextValue[] = [];

      // Try to access React fiber for context
      const fiberKey = Object.keys(element).find(
        key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
      );

      if (fiberKey) {
        const fiber = (element as any)[fiberKey];

        // Walk up the fiber tree to find contexts
        let currentFiber = fiber;
        while (currentFiber) {
          if (currentFiber.dependencies?.firstContext) {
            let contextItem = currentFiber.dependencies.firstContext;
            let contextIndex = 0;

            while (contextItem && contextIndex < 20) {
              // Limit to prevent infinite loops
              const contextValue = contextItem.memoizedValue;
              contexts.push({
                name: `Context_${contextIndex}`,
                value: contextValue,
                provider: currentFiber.type?.displayName || currentFiber.type?.name,
              });

              contextItem = contextItem.next;
              contextIndex++;
            }
          }

          currentFiber = currentFiber.return;
        }
      }

      return contexts;
    }, params.selector);

    return { contexts };
  } finally {
    // Cleanup is handled by page lifecycle
  }
}

/**
 * Get React hooks state for a component
 */
export async function componentGetHooks(
  page: Page,
  params: z.infer<typeof ComponentGetHooksSchema>
): Promise<{ hooks: HookInfo[] }> {
  const tracker = new ComponentTracker();

  try {
    await tracker.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const component = await tracker.getComponentAtElement(params.selector);

    if (!component) {
      throw new Error(`No component found at selector: ${params.selector}`);
    }

    if (component.type !== 'react') {
      throw new Error(`Hooks are only available for React components. Found: ${component.type}`);
    }

    // Extract hooks information
    const hooks = await page.evaluate(selector => {
      const element = document.querySelector(selector);
      if (!element) return [];

      const hooks: HookInfo[] = [];

      // Try to access React fiber for hooks
      const fiberKey = Object.keys(element).find(
        key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
      );

      if (fiberKey) {
        const fiber = (element as any)[fiberKey];

        // Access memoizedState which contains hooks
        let hookNode = fiber?.memoizedState;
        let index = 0;

        while (hookNode && index < 50) {
          // Limit to prevent infinite loops
          const hookInfo: HookInfo = {
            type: determineHookType(hookNode, index),
            value: hookNode.memoizedState,
            index,
          };

          // Try to extract dependencies for effects
          if (hookNode.deps !== null && hookNode.deps !== undefined) {
            hookInfo.dependencies = hookNode.deps;
          }

          hooks.push(hookInfo);
          hookNode = hookNode.next;
          index++;
        }
      }

      function determineHookType(hookNode: any, _index: number): string {
        // This is a heuristic approach since React doesn't expose hook types directly
        if (hookNode.queue !== null && hookNode.queue !== undefined) {
          return 'useState/useReducer';
        }
        if (hookNode.deps !== null && hookNode.deps !== undefined) {
          return 'useEffect/useMemo/useCallback';
        }
        if (hookNode.memoizedState && typeof hookNode.memoizedState === 'object') {
          if (hookNode.memoizedState.current !== undefined) {
            return 'useRef';
          }
        }
        return 'unknown';
      }

      return hooks;
    }, params.selector);

    return { hooks };
  } finally {
    // Cleanup is handled by page lifecycle
  }
}

// ============================================================================
// Tool Metadata for MCP Server Registration
// ============================================================================

export const COMPONENT_INTELLIGENCE_TOOLS = [
  {
    name: 'component_tree',
    description:
      'Get full React/Vue/Angular component hierarchy as a tree structure with depth information',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The URL of the page to analyze' },
        includeDepth: {
          type: 'boolean',
          description: 'Include depth information for each component',
        },
        filterFramework: {
          type: 'string',
          enum: ['react', 'vue', 'angular', 'svelte', 'all'],
          description: 'Filter components by framework',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'component_get_props',
    description: 'Get component props for a specific component selected by CSS selector',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The page URL' },
        selector: { type: 'string', description: 'CSS selector for the component' },
      },
      required: ['url', 'selector'],
    },
  },
  {
    name: 'component_get_state',
    description: 'Get component state for a specific component selected by CSS selector',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The page URL' },
        selector: { type: 'string', description: 'CSS selector for the component' },
      },
      required: ['url', 'selector'],
    },
  },
  {
    name: 'component_find_by_name',
    description: 'Find all instances of a component by name across the entire page',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The page URL' },
        componentName: {
          type: 'string',
          description: 'Name of the component to find (case-sensitive)',
        },
        includeProps: { type: 'boolean', description: 'Include props in results' },
        includeState: { type: 'boolean', description: 'Include state in results' },
      },
      required: ['url', 'componentName'],
    },
  },
  {
    name: 'component_get_source',
    description: 'Map a component to its source file, line, and column information',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The page URL' },
        selector: { type: 'string', description: 'CSS selector for the component' },
      },
      required: ['url', 'selector'],
    },
  },
  {
    name: 'component_track_renders',
    description:
      'Track component re-renders over a specified duration to identify performance issues',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The page URL' },
        selector: { type: 'string', description: 'CSS selector for the component to track' },
        duration: {
          type: 'number',
          description: 'Duration to track renders in milliseconds (1000-60000)',
        },
        captureReasons: { type: 'boolean', description: 'Attempt to capture re-render reasons' },
      },
      required: ['url', 'selector'],
    },
  },
  {
    name: 'component_get_context',
    description: 'Get React context values available to a component',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The page URL' },
        selector: { type: 'string', description: 'CSS selector for the component' },
      },
      required: ['url', 'selector'],
    },
  },
  {
    name: 'component_get_hooks',
    description: 'Get React hooks state and information for a component',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The page URL' },
        selector: { type: 'string', description: 'CSS selector for the React component' },
      },
      required: ['url', 'selector'],
    },
  },
];
