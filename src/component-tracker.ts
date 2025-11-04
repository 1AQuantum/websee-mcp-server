import type { Page } from 'playwright';

export interface SourceLocation {
  file: string;
  line?: number;
  column?: number;
  framework?: string;
}

export interface ComponentInfo {
  name: string;
  type: 'react' | 'vue' | 'angular' | 'svelte';
  source: SourceLocation;
  props: Record<string, any>;
  state?: Record<string, any>;
  parent?: string;
  children: string[];
  domNodes: string[];
  renderCount: number;
  lastRenderTime: number;
}

export class ComponentTracker {
  private page: Page | null = null;
  private componentCache: Map<string, ComponentInfo> = new Map();
  private domToComponentMap: Map<string, string> = new Map();

  async initialize(page: Page): Promise<void> {
    this.page = page;
    this.componentCache.clear();
    this.domToComponentMap.clear();

    // Inject tracking hooks into the page
    await this.injectTrackingHooks();
  }

  private async injectTrackingHooks(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.evaluate(() => {
      // Create global tracking object
      (window as any).__COMPONENT_TRACKER__ = {
        components: new Map(),
        domMap: new Map(),
        renderCounts: new Map(),
        lastRenderTimes: new Map(),
      };

      // Hook into React DevTools if available
      if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
        const tracker = (window as any).__COMPONENT_TRACKER__;

        // Patch onCommitFiberRoot to track renders
        const originalOnCommit = hook.onCommitFiberRoot;
        hook.onCommitFiberRoot = function (...args: any[]) {
          if (originalOnCommit) {
            originalOnCommit.apply(this, args);
          }
          // Track render time
          const root = args[1];
          if (root && root.current) {
            tracker.lastRenderTimes.set('react', performance.now());
          }
        };
      }

      // Hook into Vue 3 if available
      if ((window as any).Vue || (window as any).app) {
        const vue = (window as any).Vue || (window as any).app?.config?.globalProperties?.Vue;
        if (vue && vue.version?.startsWith('3')) {
          const tracker = (window as any).__COMPONENT_TRACKER__;
          // Track Vue 3 component updates
          if ((window as any).app?.__app_context__) {
            tracker.lastRenderTimes.set('vue', performance.now());
          }
        }
      }

      // Hook into Angular if available
      if ((window as any).ng?.probe) {
        const tracker = (window as any).__COMPONENT_TRACKER__;
        tracker.lastRenderTimes.set('angular', performance.now());
      }
    });
  }

  async getComponentTree(): Promise<ComponentInfo[]> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = performance.now();
    const components: ComponentInfo[] = [];

    // Extract React components
    const reactComponents = await this.extractReactComponents();
    components.push(...reactComponents);

    // Extract Vue components
    const vueComponents = await this.extractVueComponents();
    components.push(...vueComponents);

    // Extract Angular components
    const angularComponents = await this.extractAngularComponents();
    components.push(...angularComponents);

    // Update cache
    for (const comp of components) {
      this.componentCache.set(comp.name, comp);
      for (const domId of comp.domNodes) {
        this.domToComponentMap.set(domId, comp.name);
      }
    }

    const duration = performance.now() - startTime;
    if (duration > 50) {
      console.warn(`Component tree extraction took ${duration.toFixed(2)}ms (target: <50ms)`);
    }

    return components;
  }

  private async extractReactComponents(): Promise<ComponentInfo[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const components: ComponentInfo[] = [];
      const tracker = (window as any).__COMPONENT_TRACKER__;

      try {
        // Try to access React DevTools hook
        const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!hook || !hook.renderers || hook.renderers.size === 0) {
          return components;
        }

        // Iterate through React renderers
        hook.renderers.forEach((renderer: any) => {
          if (!renderer || !renderer.getCurrentFiber) return;

          // Find root fiber
          const roots = (hook as any).getFiberRoots?.(renderer.version) || [];
          roots.forEach((root: any) => {
            if (!root.current) return;

            const visitedFibers = new WeakSet();
            const walkFiber = (fiber: any, parentName?: string) => {
              if (!fiber || visitedFibers.has(fiber)) return;
              visitedFibers.add(fiber);

              const compInfo = extractComponentFromFiber(fiber, parentName, tracker);
              if (compInfo) {
                components.push(compInfo);

                // Walk children
                let child = fiber.child;
                while (child) {
                  walkFiber(child, compInfo.name);
                  child = child.sibling;
                }
              } else if (fiber.child) {
                walkFiber(fiber.child, parentName);
              }

              if (fiber.sibling) {
                walkFiber(fiber.sibling, parentName);
              }
            };

            walkFiber(root.current);
          });
        });
      } catch (e) {
        console.warn('React component extraction error:', e);
      }

      function extractComponentFromFiber(
        fiber: any,
        parentName: string | undefined,
        tracker: any
      ): ComponentInfo | null {
        try {
          // Skip non-component fibers
          if (!fiber.type || typeof fiber.type === 'string') return null;

          const name = getComponentName(fiber);
          if (
            !name ||
            name.startsWith('_') ||
            name.startsWith('Provider') ||
            name.startsWith('Consumer')
          ) {
            return null;
          }

          const domNodes: string[] = [];
          const stateNode = fiber.stateNode;
          if (stateNode && stateNode instanceof Element) {
            const id = stateNode.id || `react-${Math.random().toString(36).substr(2, 9)}`;
            if (!stateNode.id) stateNode.id = id;
            domNodes.push(id);
          }

          const source: any = {
            file: 'unknown',
            framework: 'react',
          };

          // Try to get source location from debug info
          if (fiber._debugSource) {
            source.file = fiber._debugSource.fileName || 'unknown';
            source.line = fiber._debugSource.lineNumber;
            source.column = fiber._debugSource.columnNumber;
          } else if (fiber.type._debugSource) {
            source.file = fiber.type._debugSource.fileName || 'unknown';
            source.line = fiber.type._debugSource.lineNumber;
            source.column = fiber.type._debugSource.columnNumber;
          }

          const countKey = `react:${name}`;
          const renderCount = tracker.renderCounts.get(countKey) || 0;
          tracker.renderCounts.set(countKey, renderCount + 1);

          return {
            name,
            type: 'react',
            source,
            props: fiber.memoizedProps || {},
            state: fiber.memoizedState || undefined,
            parent: parentName,
            children: [],
            domNodes,
            renderCount: renderCount + 1,
            lastRenderTime: tracker.lastRenderTimes.get('react') || 0,
          };
        } catch (e) {
          return null;
        }
      }

      function getComponentName(fiber: any): string {
        if (!fiber || !fiber.type) return 'Unknown';

        if (typeof fiber.type === 'function') {
          return fiber.type.displayName || fiber.type.name || 'Anonymous';
        }

        if (fiber.elementType && typeof fiber.elementType === 'function') {
          return fiber.elementType.displayName || fiber.elementType.name || 'Anonymous';
        }

        return 'Unknown';
      }

      return components;
    });
  }

  private async extractVueComponents(): Promise<ComponentInfo[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const components: ComponentInfo[] = [];
      const tracker = (window as any).__COMPONENT_TRACKER__;

      try {
        // Check for Vue 3
        const app = (window as any).app;
        if (!app || !app._instance) return components;

        const visitedInstances = new WeakSet();
        const walkInstance = (instance: any, parentName?: string) => {
          if (!instance || visitedInstances.has(instance)) return;
          visitedInstances.add(instance);

          const name = instance.type?.name || instance.type?.__name || 'Anonymous';
          if (name.startsWith('_')) return;

          const domNodes: string[] = [];
          if (instance.vnode?.el && instance.vnode.el instanceof Element) {
            const id = instance.vnode.el.id || `vue-${Math.random().toString(36).substr(2, 9)}`;
            if (!instance.vnode.el.id) instance.vnode.el.id = id;
            domNodes.push(id);
          }

          const source: any = {
            file: instance.type?.__file || 'unknown',
            framework: 'vue',
          };

          const countKey = `vue:${name}`;
          const renderCount = tracker.renderCounts.get(countKey) || 0;
          tracker.renderCounts.set(countKey, renderCount + 1);

          components.push({
            name,
            type: 'vue',
            source,
            props: instance.props || {},
            state: instance.data || instance.setupState || undefined,
            parent: parentName,
            children: [],
            domNodes,
            renderCount: renderCount + 1,
            lastRenderTime: tracker.lastRenderTimes.get('vue') || 0,
          });

          // Walk children
          const children = instance.subTree?.children || [];
          if (Array.isArray(children)) {
            children.forEach((child: any) => {
              if (child && child.component) {
                walkInstance(child.component, name);
              }
            });
          }
        };

        walkInstance(app._instance);
      } catch (e) {
        console.warn('Vue component extraction error:', e);
      }

      return components;
    });
  }

  private async extractAngularComponents(): Promise<ComponentInfo[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const components: ComponentInfo[] = [];
      const tracker = (window as any).__COMPONENT_TRACKER__;

      try {
        const ng = (window as any).ng;
        if (!ng?.probe) return components;

        // Find all Angular components in the DOM
        const allElements = document.querySelectorAll('*');
        const visitedComponents = new Set<any>();

        allElements.forEach((el: Element) => {
          try {
            const debugElement = ng.probe(el);
            if (!debugElement || !debugElement.componentInstance) return;

            const instance = debugElement.componentInstance;
            if (visitedComponents.has(instance)) return;
            visitedComponents.add(instance);

            const name = instance.constructor?.name || 'Anonymous';
            if (name === 'Object' || name.startsWith('_')) return;

            const id = (el as HTMLElement).id || `ng-${Math.random().toString(36).substr(2, 9)}`;
            if (!(el as HTMLElement).id) (el as HTMLElement).id = id;

            const source: any = {
              file: 'unknown',
              framework: 'angular',
            };

            const countKey = `angular:${name}`;
            const renderCount = tracker.renderCounts.get(countKey) || 0;
            tracker.renderCounts.set(countKey, renderCount + 1);

            // Extract props (inputs) and state
            const props: Record<string, any> = {};
            const state: Record<string, any> = {};

            for (const key in instance) {
              if (instance.hasOwnProperty(key) && !key.startsWith('_')) {
                const value = instance[key];
                if (typeof value !== 'function') {
                  state[key] = value;
                }
              }
            }

            components.push({
              name,
              type: 'angular',
              source,
              props,
              state,
              parent: undefined,
              children: [],
              domNodes: [id],
              renderCount: renderCount + 1,
              lastRenderTime: tracker.lastRenderTimes.get('angular') || 0,
            });
          } catch (e) {
            // Skip elements that aren't Angular components
          }
        });
      } catch (e) {
        console.warn('Angular component extraction error:', e);
      }

      return components;
    });
  }

  async getComponentAtElement(selector: string): Promise<ComponentInfo | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // First, ensure we have the latest component tree
      await this.getComponentTree();

      // Get the element's ID or create one
      const elementId = await this.page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;

        const htmlEl = el as HTMLElement;
        if (htmlEl.id) return htmlEl.id;

        const newId = `elem-${Math.random().toString(36).substr(2, 9)}`;
        htmlEl.id = newId;
        return newId;
      }, selector);

      if (!elementId) return null;

      // Look up the component in our map
      const componentName = this.domToComponentMap.get(elementId);
      if (!componentName) return null;

      return this.componentCache.get(componentName) || null;
    } catch (e) {
      console.error('Error getting component at element:', e);
      return null;
    }
  }
}
