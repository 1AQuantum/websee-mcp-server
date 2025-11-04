# Component Intelligence - Framework Support

Detailed framework compatibility for all 8 component intelligence tools.

## Framework Compatibility Matrix

| Tool | React | Vue | Angular | Svelte | Notes |
|------|-------|-----|---------|--------|-------|
| component_tree | ✅ Full | ✅ Full | ✅ Full | ✅ Full | No DevTools needed |
| component_get_props | ✅ Full | ✅ Full | ⚠️ Partial | ⚠️ Partial | Requires DevTools |
| component_get_state | ✅ Full | ✅ Full | ⚠️ Partial | ⚠️ Partial | Requires DevTools |
| component_find_by_name | ✅ Full | ✅ Full | ✅ Full | ✅ Full | No DevTools needed |
| component_get_source | ✅ Full | ✅ Full | ⚠️ Partial | ❌ Limited | Requires DevTools + source maps |
| component_track_renders | ✅ Full | ✅ Full | ❌ Limited | ❌ Limited | React/Vue DevTools only |
| component_get_context | ✅ Full | ⚠️ Partial | ❌ Not supported | ❌ Not supported | React Context, Vue provide/inject |
| component_get_hooks | ✅ Full | ✅ Full | ❌ Not supported | ❌ Not supported | React hooks, Vue Composition API |

**Legend**:
- ✅ **Full** - All features supported
- ⚠️ **Partial** - Core features supported, some limitations
- ❌ **Limited** - Basic support only
- ❌ **Not supported** - Framework doesn't have this concept

---

## React Support

### Version Support
- ✅ React 16.8+ (Hooks)
- ✅ React 17.x
- ✅ React 18.x (Latest)
- ✅ Class components
- ✅ Function components

### Features

#### Props Inspection
```typescript
// All prop types supported
- Primitives (string, number, boolean)
- Objects and arrays
- Functions (shown as [Function])
- JSX elements (shown as React elements)
- Custom prop types
```

#### State Inspection
```typescript
// useState hooks
const [count, setCount] = useState(0);
// Shows: { count: 0 }

// Class component state
this.state = { user: {...}, loading: true };
// Shows: { user: {...}, loading: true }

// Reducers
const [state, dispatch] = useReducer(reducer, initialState);
// Shows: { ...reducerState }
```

#### Context Support
```typescript
// Context consumers
const theme = useContext(ThemeContext);
// Shows: { theme: "dark" }

// Multiple contexts
const user = useContext(UserContext);
const settings = useContext(SettingsContext);
// Shows both contexts with provider chain
```

#### Hooks Support
```typescript
// All hooks detected
- useState → Shows value
- useEffect → Shows dependencies
- useContext → Shows context value
- useRef → Shows current value
- useMemo → Shows memoized value
- useCallback → Shows dependencies
- Custom hooks → Shows internal state
```

### DevTools Requirements

**Required for**:
- Props inspection
- State inspection (hooks and class state)
- Context values
- Hooks details
- Render tracking
- Source location

**Not required for**:
- Component tree (works without DevTools)
- Find by name (works without DevTools)

### Installation

```bash
# Chrome
https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi

# Firefox
https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

# Edge
https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil
```

---

## Vue Support

### Version Support
- ✅ Vue 2.x (Options API)
- ✅ Vue 3.x (Composition API)
- ✅ Single File Components (.vue)

### Features

#### Props Inspection
```javascript
// Vue 3 Composition API
const props = defineProps({
  user: Object,
  count: Number
});
// Shows: { user: {...}, count: 42 }

// Vue 2 Options API
props: ['name', 'age']
// Shows: { name: "John", age: 30 }
```

#### State Inspection
```javascript
// Vue 3 Composition API
const count = ref(0);
const user = reactive({ name: 'John' });
// Shows: { count: 0, user: { name: 'John' } }

// Vue 2 Options API
data() {
  return { message: 'Hello', items: [] };
}
// Shows: { message: 'Hello', items: [] }
```

#### Context Support (provide/inject)
```javascript
// Provider
provide('theme', 'dark');

// Consumer
const theme = inject('theme');
// Shows: { theme: "dark" }
```

#### Hooks Support (Composition API)
```javascript
// Supported
- ref() → Shows value
- reactive() → Shows object
- computed() → Shows computed value
- watch() → Shows dependencies
- onMounted/onUpdated → Shows lifecycle
- Custom composables → Shows internal state
```

### DevTools Requirements

Similar to React, most advanced features require Vue DevTools.

### Installation

```bash
# Chrome
https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd

# Firefox
https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/
```

---

## Angular Support

### Version Support
- ✅ Angular 12+
- ✅ Angular 13-17
- ✅ Component-based architecture
- ⚠️ Limited standalone component support

### Features

#### Props Inspection (@Input)
```typescript
@Input() user: User;
@Input() count: number = 0;
// Shows: { user: {...}, count: 0 }
```

#### State Inspection
```typescript
// Class properties
public items: Item[] = [];
private _internalState = {};
// Shows: { items: [], _internalState: {} }
```

#### Limited Context Support
Angular uses dependency injection, not context.
```typescript
// Services shown as dependencies
constructor(
  private userService: UserService,
  private http: HttpClient
) {}
// Shows: { userService: UserService, http: HttpClient }
```

#### No Hooks Support
Angular uses decorators and lifecycle hooks, not React-style hooks.

### DevTools Requirements

Angular DevTools required for most features.

### Installation

```bash
# Chrome
https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh
```

---

## Svelte Support

### Version Support
- ✅ Svelte 3.x
- ✅ Svelte 4.x
- ⚠️ SvelteKit (partial)

### Features

#### Props Inspection
```javascript
export let name = 'world';
export let count = 0;
// Shows: { name: 'world', count: 0 }
```

#### State Inspection
```javascript
let count = 0;
let user = { name: 'John' };
// Shows: { count: 0, user: { name: 'John' } }

// Stores
import { writable } from 'svelte/store';
const count = writable(0);
// Shows store value
```

#### Limited Context Support
```javascript
// Context
import { setContext, getContext } from 'svelte';
setContext('theme', 'dark');
// Limited visibility without DevTools
```

#### No Hooks Support
Svelte uses reactive declarations, not hooks.

### DevTools Requirements

Svelte DevTools recommended but less critical than React/Vue.

### Installation

```bash
# Chrome
https://chrome.google.com/webstore/detail/svelte-devtools/ckolcbmkjpjmangdbmnkpjigpkddpogn
```

---

## Framework Detection

WebSee automatically detects frameworks:

### Detection Method
```javascript
// React detection
window.React || document.querySelector('[data-reactroot]')

// Vue detection
window.__VUE__ || document.querySelector('[data-v-]')

// Angular detection
window.ng || document.querySelector('[ng-version]')

// Svelte detection
document.querySelector('[data-svelte]') || window.__svelte
```

### Multiple Frameworks
If multiple frameworks detected on one page:
- Tools target the framework at the specified selector
- Framework specified in tool response
- Can inspect different frameworks on same page

---

## Best Practices by Framework

### React
1. Install React DevTools for full functionality
2. Use specific selectors (data-testid, className)
3. Enable source maps for source location
4. Consider React.StrictMode for render tracking

### Vue
1. Install Vue DevTools
2. Use ref/reactive for better inspection
3. Name components for easier finding
4. Use provide/inject for context (not EventBus)

### Angular
1. Install Angular DevTools
2. Use component selectors for targeting
3. Avoid deeply nested components (performance)
4. Use @Input/@Output for clear data flow

### Svelte
1. Install Svelte DevTools (optional)
2. Use stores for complex state
3. Name components clearly
4. Keep component tree shallow

---

## Troubleshooting by Framework

### React

**"Component not found"**
- Verify component mounted (not in Suspense)
- Check for React.memo wrapping
- Try data-testid selector instead of class

**"Props not available"**
- Install React DevTools
- Refresh DevTools connection
- Check if production build has DevTools support

**"Hooks not showing"**
- Only works with React 16.8+
- Requires React DevTools
- Class components don't have hooks

### Vue

**"State not reactive"**
- Use ref() or reactive() in Composition API
- Check data() function in Options API
- Verify not using plain objects

**"Context not found"**
- Verify provide() in ancestor
- Check inject() key matches
- Ensure component mounted

### Angular

**"Limited component info"**
- Install Angular DevTools
- Check Angular version (12+ required)
- Enable debug mode in production

### Svelte

**"Store value not showing"**
- Use $ prefix for auto-subscription
- Verify store imported correctly
- Check if store is writable/readable

---

**Framework Support Summary**:
- **React**: ✅ Best support (8/8 tools, 100% features)
- **Vue**: ✅ Excellent support (6/8 tools, 90% features)
- **Angular**: ⚠️ Good support (5/8 tools, 70% features)
- **Svelte**: ⚠️ Basic support (4/8 tools, 50% features)
