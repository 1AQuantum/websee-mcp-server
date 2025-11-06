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

    // Install DevTools hook BEFORE page loads (critical for React detection)
    await this.installDevToolsHook();
  }

  private async installDevToolsHook(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    // This needs to run BEFORE React loads, so we use addInitScript
    await this.page.addInitScript(() => {
      // Install minimal React DevTools hook if not present
      if (!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const hook: any = {
          renderers: new Map(),
          supportsFiber: true,
          inject(renderer: any) {
            const id = Math.random().toString(36).slice(2);
            this.renderers.set(id, renderer);
            console.log('[WebSee] Renderer registered:', id);
            return id;
          },
          onCommitFiberRoot(_rendererID: any, root: any) {
            // Track render time
            if ((window as any).__COMPONENT_TRACKER__ && root?.current) {
              (window as any).__COMPONENT_TRACKER__.lastRenderTimes.set('react', performance.now());
            }
          },
          onCommitFiberUnmount() {},
          getFiberRoots(_rendererID: string) {
            const roots: any[] = [];
            // Find React roots in the DOM
            const rootElements = document.querySelectorAll('[data-reactroot], #root, [id*="root"]');
            rootElements.forEach(el => {
              const fiberKey = Object.keys(el).find(
                key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance') || key.startsWith('__reactContainer')
              );
              if (fiberKey) {
                let fiber = (el as any)[fiberKey];
                if (fiber) {
                  // In React 18+, __reactContainer points to a HostRoot fiber
                  // The stateNode property contains the FiberRoot which has the current property
                  if (fiberKey.startsWith('__reactContainer') && fiber.stateNode && fiber.stateNode.current) {
                    roots.push({ current: fiber.stateNode.current });
                  } else {
                    // For older React versions, navigate to the root fiber
                    let current = fiber;
                    while (current.return) {
                      current = current.return;
                    }
                    roots.push({ current });
                  }
                }
              }
            });
            return roots;
          }
        };

        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
        console.log('[WebSee] React DevTools hook installed before page load');
      }
    });

    // Also inject tracking hooks that need to run after page content loads
    await this.injectTrackingHooks();
  }

  private async injectTrackingHooks(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    // Use addInitScript to ensure it runs before page loads
    await this.page.addInitScript(() => {
      // Create global tracking object
      (window as any).__COMPONENT_TRACKER__ = {
        components: new Map(),
        domMap: new Map(),
        renderCounts: new Map(),
        lastRenderTimes: new Map(),
      };
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

        // Fallback: Direct fiber detection from DOM if hook doesn't have renderers
        let roots: any[] = [];

        if (hook && typeof hook.getFiberRoots === 'function') {
          // Use hook's getFiberRoots method
          roots = hook.getFiberRoots('') || [];
        }

        // Fallback: Manual fiber detection from DOM
        if (roots.length === 0) {
          console.log('[WebSee] Using fallback fiber detection from DOM');
          const rootElements = document.querySelectorAll('[data-reactroot], #root, [id*="root"], [class*="root"]');
          rootElements.forEach(el => {
            const fiberKey = Object.keys(el).find(
              key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance') || key.startsWith('__reactContainer')
            );
            if (fiberKey) {
              let fiber = (el as any)[fiberKey];
              if (fiber) {
                // In React 18+, __reactContainer points to a HostRoot fiber
                // The stateNode property contains the FiberRoot which has the current property
                if (fiberKey.startsWith('__reactContainer') && fiber.stateNode && fiber.stateNode.current) {
                  console.log('[WebSee] Found React 18+ container, using stateNode.current');
                  roots.push({ current: fiber.stateNode.current });
                } else {
                  // For older React versions, navigate to the root fiber
                  while (fiber.return) {
                    fiber = fiber.return;
                  }
                  roots.push({ current: fiber });
                }
              }
            }
          });
        }

        if (roots.length === 0) {
          console.warn('[WebSee] No React roots found');
          return components;
        }

        console.log(`[WebSee] Found ${roots.length} React root(s)`);

        // Process each root
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

        console.log(`[WebSee] Extracted ${components.length} React components`);
      } catch (e) {
        console.error('[WebSee] React component extraction error:', e);
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

          // Find DOM nodes for this component
          // For function components, we need to traverse children to find DOM nodes
          const findDOMNode = (f: any): Element | null => {
            if (!f) return null;

            // If this fiber has a DOM node (HostComponent), use it
            if (f.stateNode && f.stateNode instanceof Element) {
              return f.stateNode;
            }

            // Otherwise, traverse to children to find the first DOM node
            let child = f.child;
            while (child) {
              const found = findDOMNode(child);
              if (found) return found;
              child = child.sibling;
            }

            return null;
          };

          const domNode = findDOMNode(fiber);
          if (domNode) {
            const id = domNode.id || `react-${Math.random().toString(36).substr(2, 9)}`;
            if (!domNode.id) domNode.id = id;
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
