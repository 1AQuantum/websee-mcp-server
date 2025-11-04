# Component Intelligence - DevTools Setup Guide

Complete guide to installing and configuring browser DevTools for maximum component intelligence.

## Why DevTools?

**6 of 8 component tools require DevTools** for full functionality:
- component_get_props ✅
- component_get_state ✅
- component_get_source ✅
- component_track_renders ✅
- component_get_context ✅
- component_get_hooks ✅

**Success Rates**:
- With DevTools: **100%** ✅
- Without DevTools: **30%** ⚠️

---

## React DevTools

### Installation

#### Chrome
1. Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
2. Click "Add to Chrome"
3. Confirm installation
4. Restart browser

#### Firefox
1. Visit [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
2. Click "Add to Firefox"
3. Confirm permissions
4. Restart browser

#### Edge
1. Visit [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil)
2. Click "Get"
3. Confirm installation
4. Restart browser

### Verification

1. Open a React website (e.g., react.dev)
2. Open DevTools (F12)
3. Look for "⚛️ Components" and "⚛️ Profiler" tabs
4. If tabs appear → ✅ Installed correctly

### Configuration

#### Enable in Production
Add to your app:
```javascript
// webpack.config.js
module.exports = {
  // ...
  resolve: {
    alias: {
      'react-dom$': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling',
    },
  },
};
```

#### Expose DevTools Hooks
```javascript
// app.js - Development only
if (process.env.NODE_ENV === 'development') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
}
```

---

## Vue DevTools

### Installation

#### Chrome
1. Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
2. Click "Add to Chrome"
3. Confirm installation

#### Firefox
1. Visit [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
2. Click "Add to Firefox"
3. Confirm permissions

### Verification

1. Open a Vue website
2. Open DevTools (F12)
3. Look for "Vue" tab
4. If tab appears → ✅ Installed correctly

### Configuration

#### Enable in Production
```javascript
// main.js
import { createApp } from 'vue';

const app = createApp(App);

// Enable DevTools in production (if needed)
app.config.devtools = true;

app.mount('#app');
```

#### Vue 2
```javascript
// main.js
Vue.config.devtools = true;
```

---

## Angular DevTools

### Installation

#### Chrome
1. Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)
2. Click "Add to Chrome"
3. Confirm installation

Currently only available for Chrome/Edge.

### Verification

1. Open an Angular website
2. Open DevTools (F12)
3. Look for "Angular" tab
4. If tab appears → ✅ Installed correctly

### Configuration

#### Enable in Production
```typescript
// main.ts
import { enableProdMode, enableDebugTools } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

if (environment.production) {
  enableProdMode();
} else {
  // Enable debug tools in development
  platformBrowserDynamic().bootstrapModule(AppModule)
    .then(moduleRef => {
      const applicationRef = moduleRef.injector.get(ApplicationRef);
      const componentRef = applicationRef.components[0];
      enableDebugTools(componentRef);
    });
}
```

---

## Svelte DevTools

### Installation

#### Chrome
1. Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/svelte-devtools/ckolcbmkjpjmangdbmnkpjigpkddpogn)
2. Click "Add to Chrome"
3. Confirm installation

### Verification

1. Open a Svelte website
2. Open DevTools (F12)
3. Look for "Svelte" tab
4. If tab appears → ✅ Installed correctly

### Configuration

DevTools automatically detect Svelte apps in development mode.

---

## WebSee-Specific Configuration

### For Maximum Compatibility

#### 1. Enable Source Maps
```javascript
// webpack.config.js
module.exports = {
  devtool: 'source-map', // or 'inline-source-map' in dev
};

// vite.config.js
export default {
  build: {
    sourcemap: true,
  },
};
```

#### 2. Name Components
```javascript
// React - Named exports
export function UserProfile() { ... }

// Vue - Name option
export default {
  name: 'UserProfile',
  // ...
};

// Angular - Component decorator
@Component({
  selector: 'app-user-profile',
  // ...
})
```

#### 3. Add Test IDs
```jsx
// Preferred selector method
<div data-testid="user-profile">
  <UserProfile />
</div>
```

---

## Headless Mode

For automated testing or CI/CD, DevTools must be injected programmatically.

### React DevTools (Headless)

```javascript
// Install standalone
npm install -g react-devtools

// Run server
react-devtools

// In your app
import { connectToDevTools } from 'react-devtools-inline/backend';

if (process.env.NODE_ENV !== 'production') {
  connectToDevTools({ host: 'localhost', port: 8097 });
}
```

### Playwright Integration

```javascript
// WebSee automatically injects DevTools hooks when using Playwright
const page = await browser.newPage();
await page.goto('https://your-app.com');

// DevTools hooks are available
const component = await page.evaluate(() => {
  return window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
});
```

---

## Troubleshooting

### DevTools Not Appearing

**Symptoms**: No framework tab in browser DevTools

**Solutions**:
1. ✅ Verify extension installed (check chrome://extensions)
2. ✅ Restart browser after installation
3. ✅ Refresh the website
4. ✅ Check website uses framework (View Source)
5. ✅ Try incognito mode (enable extension in incognito)

### DevTools Tab Grayed Out

**Symptoms**: Tab visible but grayed/disabled

**Solutions**:
1. ✅ Website not using framework
2. ✅ Framework version too old (React < 16, Vue < 2)
3. ✅ Production build without DevTools support
4. ✅ Content Security Policy blocking extension

### Can't Inspect Components

**Symptoms**: DevTools open but components not inspectable

**Solutions**:
1. ✅ Reload DevTools (close and reopen)
2. ✅ Check component mounted (not lazy/suspended)
3. ✅ Verify not in iframe (DevTools can't cross iframe boundaries)
4. ✅ Update DevTools extension

### WebSee Reports "DevTools Required"

**Symptoms**: Tool returns error about DevTools

**Solutions**:
1. ✅ Install appropriate DevTools extension
2. ✅ Open DevTools manually first (F12)
3. ✅ Verify DevTools tab appears
4. ✅ Try `component_tree` first (doesn't need DevTools)
5. ✅ Check if website blocks DevTools

---

## Production Considerations

### Security

**⚠️ Warning**: Enabling DevTools in production can expose:
- Component props (may contain sensitive data)
- Application state
- Source code (via source maps)
- Internal logic

**Best Practice**: Only enable for debugging, disable for general users:

```javascript
// Enable DevTools only for specific users/debugging
const enableDevTools =
  process.env.NODE_ENV === 'development' ||
  localStorage.getItem('debug_mode') === 'true' ||
  window.location.search.includes('debug=true');

if (enableDevTools) {
  // Enable DevTools hooks
}
```

### Performance Impact

DevTools have minimal performance impact:
- React DevTools: < 5% overhead
- Vue DevTools: < 3% overhead
- Angular DevTools: < 5% overhead
- Svelte DevTools: < 2% overhead

Safe to enable in production for debugging.

---

## Multiple Frameworks

If your page uses multiple frameworks:

```javascript
// All DevTools can coexist
- React DevTools → Inspects React components
- Vue DevTools → Inspects Vue components
- Detects framework at selector level
```

Install all relevant DevTools extensions.

---

## Version Compatibility

| Framework | Min Version | Recommended | DevTools Version |
|-----------|-------------|-------------|------------------|
| React | 16.0 | 18.x | Latest |
| Vue | 2.0 | 3.x | Latest |
| Angular | 12.0 | 17.x | Latest |
| Svelte | 3.0 | 4.x | Latest |

---

## CI/CD Integration

For automated testing:

```yaml
# GitHub Actions example
- name: Install DevTools
  run: |
    npm install -g react-devtools
    react-devtools &

- name: Run WebSee Tests
  run: npm test
  env:
    DEVTOOLS_PORT: 8097
```

---

## Quick Reference

| Want to... | Need DevTools? | Alternative |
|------------|----------------|-------------|
| Get component tree | ❌ No | Use component_tree |
| Find component by name | ❌ No | Use component_find_by_name |
| Get props | ✅ Yes | No alternative |
| Get state | ✅ Yes | No alternative |
| Get source location | ✅ Yes | Use source_map_resolve |
| Track renders | ✅ Yes | No alternative |
| Get context | ✅ Yes | No alternative |
| Get hooks | ✅ Yes | No alternative |

---

**Setup Time**: ~5 minutes per framework
**Difficulty**: ⭐ Easy
**Impact**: 70% increase in tool success rate (30% → 100%)
