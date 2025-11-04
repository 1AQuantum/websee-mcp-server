# Network Intelligence Tools - Quick Reference Guide

## Tool Overview

The WebSee MCP Server provides 6 powerful network intelligence tools for debugging and analyzing web application network traffic.

---

## 1. network_get_requests

**Get all network requests made by a page**

### Usage:
```javascript
{
  "url": "https://example.com",
  "waitTime": 3000  // Optional, default 3000ms
}
```

### Returns:
```json
{
  "requests": [
    {
      "url": "https://api.example.com/data",
      "method": "GET",
      "status": 200,
      "duration": 245,
      "size": 1234,
      "timestamp": 1698345678901,
      "initiator": { "type": "fetch", ... },
      "stackTrace": [...],
      "requestHeaders": {...},
      "responseHeaders": {...}
    }
  ]
}
```

### Use Cases:
- Get overview of all network activity
- Performance audit (see all requests and timing)
- Find unexpected network calls
- Monitor API usage

### Example Scenarios:
```javascript
// Audit a page for performance
network_get_requests({
  url: "https://myapp.com/dashboard",
  waitTime: 5000
})

// Quick network overview
network_get_requests({
  url: "https://myapp.com",
  waitTime: 2000
})
```

---

## 2. network_get_by_url

**Filter network requests by URL pattern (supports wildcards)**

### Usage:
```javascript
{
  "url": "https://example.com",
  "pattern": "*/api/*"  // Wildcard pattern
}
```

### Pattern Examples:
- `*/api/*` - All API calls
- `*.json` - All JSON files
- `*graphql*` - All GraphQL requests
- `https://api.example.com/*` - Specific domain

### Returns:
```json
{
  "requests": [
    {
      "url": "https://api.example.com/users",
      "method": "GET",
      "status": 200,
      "duration": 156,
      "timestamp": 1698345678901,
      "initiator": {...}
    }
  ]
}
```

### Use Cases:
- Filter API calls from all requests
- Find specific types of requests (images, JSON, etc.)
- Analyze third-party requests
- Debug specific endpoints

### Example Scenarios:
```javascript
// Find all API calls
network_get_by_url({
  url: "https://myapp.com",
  pattern: "*/api/*"
})

// Find all analytics requests
network_get_by_url({
  url: "https://myapp.com",
  pattern: "*analytics*"
})

// Find all images
network_get_by_url({
  url: "https://myapp.com",
  pattern: "*.(png|jpg|jpeg|gif|svg)"
})
```

---

## 3. network_get_timing

**Get detailed timing metrics for a specific request**

### Usage:
```javascript
{
  "url": "https://example.com",
  "requestUrl": "https://api.example.com/data"
}
```

### Returns:
```json
{
  "dns": 23,
  "connect": 45,
  "ssl": 67,
  "ttfb": 156,
  "download": 12,
  "total": 245
}
```

### Timing Breakdown:
- **dns** - DNS lookup time
- **connect** - TCP connection time
- **ssl** - SSL handshake time (HTTPS only)
- **ttfb** - Time to First Byte (server processing time)
- **download** - Response download time
- **total** - Total request time

### Use Cases:
- Identify slow API calls
- Diagnose network issues (DNS, SSL, connection)
- Measure server response time (TTFB)
- Find large downloads

### Performance Guidelines:
- **Good:** total < 200ms, ttfb < 100ms
- **Acceptable:** total < 500ms, ttfb < 300ms
- **Slow:** total > 1000ms, ttfb > 500ms

### Example Scenarios:
```javascript
// Debug slow API call
network_get_timing({
  url: "https://myapp.com",
  requestUrl: "https://api.myapp.com/slow-endpoint"
})
// If ttfb is high → server is slow
// If download is high → response is large
// If dns/connect is high → network issue
```

---

## 4. network_trace_initiator

**Trace a network request to its source code origin**

### Usage:
```javascript
{
  "url": "https://example.com",
  "requestUrl": "https://api.example.com/track"
}
```

### Returns:
```json
{
  "file": "https://example.com/app.js",
  "line": 42,
  "column": 15,
  "function": "trackEvent",
  "stackTrace": [
    {
      "file": "https://example.com/app.js",
      "line": 42,
      "column": 15,
      "function": "trackEvent"
    },
    {
      "file": "https://example.com/app.js",
      "line": 128,
      "column": 8,
      "function": "handleClick"
    }
  ]
}
```

### Use Cases:
- Find which code is making unexpected requests
- Debug analytics calls
- Track down third-party script requests
- Understand request flow

### Note:
Stack traces may not be available for:
- Browser internal requests
- Third-party scripts without source maps
- Resource loading (images, CSS)

### Example Scenarios:
```javascript
// Find which code is calling analytics
network_trace_initiator({
  url: "https://myapp.com",
  requestUrl: "https://analytics.google.com/collect"
})

// Debug unexpected API call
network_trace_initiator({
  url: "https://myapp.com",
  requestUrl: "https://api.myapp.com/unexpected"
})
```

---

## 5. network_get_headers

**Get request and response headers for a specific request**

### Usage:
```javascript
{
  "url": "https://example.com",
  "requestUrl": "https://api.example.com/data"
}
```

### Returns:
```json
{
  "requestHeaders": {
    "accept": "application/json",
    "authorization": "Bearer token123",
    "content-type": "application/json",
    "x-api-key": "secret-key"
  },
  "responseHeaders": {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "max-age=3600",
    "access-control-allow-origin": "*",
    "x-rate-limit-remaining": "99"
  }
}
```

### Use Cases:
- Debug CORS issues (check `access-control-*` headers)
- Verify authentication headers
- Check caching headers
- Inspect custom headers
- Debug API key issues

### Common Headers to Check:

**Request Headers:**
- `authorization` - Auth token/API key
- `content-type` - Request body format
- `accept` - Expected response format
- `x-*` - Custom headers

**Response Headers:**
- `content-type` - Response format
- `cache-control` - Caching behavior
- `access-control-allow-origin` - CORS policy
- `x-rate-limit-*` - API rate limiting

### Example Scenarios:
```javascript
// Debug CORS issue
network_get_headers({
  url: "https://myapp.com",
  requestUrl: "https://api.other-domain.com/data"
})
// Check: access-control-allow-origin in responseHeaders

// Verify authentication
network_get_headers({
  url: "https://myapp.com",
  requestUrl: "https://api.myapp.com/protected"
})
// Check: authorization in requestHeaders

// Check caching
network_get_headers({
  url: "https://myapp.com",
  requestUrl: "https://cdn.example.com/bundle.js"
})
// Check: cache-control in responseHeaders
```

---

## 6. network_get_body

**Get request and response body for a specific request**

### Usage:
```javascript
{
  "url": "https://example.com",
  "requestUrl": "https://api.example.com/create"
}
```

### Returns:
```json
{
  "requestBody": "{\"name\":\"John\",\"email\":\"john@example.com\"}",
  "responseBody": "{\"id\":123,\"name\":\"John\",\"email\":\"john@example.com\"}",
  "contentType": "application/json; charset=utf-8"
}
```

### Use Cases:
- Verify API request data
- Check API response format
- Debug malformed requests
- Inspect response data
- Validate JSON structure

### Content Types Supported:
- `application/json` - JSON data
- `application/xml` - XML data
- `text/plain` - Plain text
- `application/x-www-form-urlencoded` - Form data
- And more...

### Note:
- GET requests typically have `requestBody: null`
- Some responses may not have bodies (204 No Content)
- Large bodies are fully captured

### Example Scenarios:
```javascript
// Debug failed POST request
network_get_body({
  url: "https://myapp.com",
  requestUrl: "https://api.myapp.com/users"
})
// Check if requestBody matches API expectations

// Validate API response
network_get_body({
  url: "https://myapp.com",
  requestUrl: "https://api.myapp.com/data"
})
// Parse responseBody and check data structure

// Debug form submission
network_get_body({
  url: "https://myapp.com/form",
  requestUrl: "https://api.myapp.com/submit"
})
// Check form data in requestBody
```

---

## Common Workflows

### Workflow 1: Debug Slow Page Load

```javascript
// Step 1: Get all requests
network_get_requests({
  url: "https://myapp.com",
  waitTime: 5000
})
// → Find slowest requests

// Step 2: Get timing for slow request
network_get_timing({
  url: "https://myapp.com",
  requestUrl: "https://api.myapp.com/slow-endpoint"
})
// → Check if server (ttfb) or download is slow

// Step 3: Get body if download is slow
network_get_body({
  url: "https://myapp.com",
  requestUrl: "https://api.myapp.com/slow-endpoint"
})
// → Check if response is too large
```

### Workflow 2: Debug Failed API Call

```javascript
// Step 1: Get all API requests
network_get_by_url({
  url: "https://myapp.com",
  pattern: "*/api/*"
})
// → Find the failed request (status 4xx or 5xx)

// Step 2: Check headers
network_get_headers({
  url: "https://myapp.com",
  requestUrl: "https://api.myapp.com/endpoint"
})
// → Verify authorization, content-type

// Step 3: Check request/response body
network_get_body({
  url: "https://myapp.com",
  requestUrl: "https://api.myapp.com/endpoint"
})
// → Verify request format, check error message
```

### Workflow 3: Find Source of Unexpected Request

```javascript
// Step 1: Get all requests
network_get_requests({
  url: "https://myapp.com",
  waitTime: 5000
})
// → Find unexpected request URL

// Step 2: Trace to source
network_trace_initiator({
  url: "https://myapp.com",
  requestUrl: "https://unexpected-domain.com/track"
})
// → Get file, line, column of code making request

// Step 3: Get headers to understand purpose
network_get_headers({
  url: "https://myapp.com",
  requestUrl: "https://unexpected-domain.com/track"
})
// → Check what data is being sent
```

### Workflow 4: Performance Audit

```javascript
// Step 1: Get all requests
const all = network_get_requests({
  url: "https://myapp.com",
  waitTime: 5000
})
// Count: How many requests? (target: < 50)
// Check: Any requests > 1000ms? (target: < 200ms)

// Step 2: Filter API calls
const api = network_get_by_url({
  url: "https://myapp.com",
  pattern: "*/api/*"
})
// Check: How many API calls? (target: < 10)
// Check: Can any be combined/cached?

// Step 3: Check caching headers
network_get_headers({
  url: "https://myapp.com",
  requestUrl: "https://cdn.myapp.com/bundle.js"
})
// Check: cache-control header
// Target: max-age > 3600 for static assets
```

---

## Tips & Best Practices

### 1. Wait Time

Choose appropriate wait time based on page type:
- **Static pages:** 2000ms
- **Normal SPA:** 3000-4000ms
- **Heavy API usage:** 5000-8000ms
- **Real-time apps:** 8000-10000ms

### 2. Pattern Matching

Be specific for better performance:
- ✅ Good: `https://api.myapp.com/*`
- ❌ Too broad: `*`
- ✅ Good: `*/api/v1/*`
- ❌ Too broad: `*/api/*` (if you have v1, v2, v3)

### 3. Error Handling

Always check for errors:
```javascript
const result = await network_get_timing({...});
if ('error' in result) {
  console.log('Error:', result.error);
} else {
  console.log('Timing:', result.total);
}
```

### 4. Large Responses

Be careful with large response bodies:
```javascript
const body = await network_get_body({...});
if (body.responseBody.length > 100000) {
  console.log('Large response:', body.responseBody.length, 'bytes');
  // Consider pagination or compression
}
```

---

## Troubleshooting

### "Request not found"
**Cause:** Request hasn't been made yet or URL doesn't match
**Solution:**
- Increase `waitTime`
- Verify exact URL (case-sensitive)
- Check if request is actually made

### "No stack trace available"
**Cause:** Request made by browser internals or third-party
**Solution:**
- Expected for some request types
- Focus on fetch/XHR requests for best stack traces

### Empty requests array
**Cause:** Page makes no requests or `waitTime` too short
**Solution:**
- Increase `waitTime`
- Verify page loads correctly
- Check browser console for errors

---

## Quick Decision Tree

**What do you want to do?**

1. **See all network activity** → `network_get_requests`
2. **Find specific requests** → `network_get_by_url`
3. **Measure performance** → `network_get_timing`
4. **Find source code** → `network_trace_initiator`
5. **Debug CORS/auth** → `network_get_headers`
6. **Check data** → `network_get_body`

**What's the problem?**

1. **Page is slow** → `network_get_requests` + `network_get_timing`
2. **API failing** → `network_get_headers` + `network_get_body`
3. **Unexpected request** → `network_trace_initiator`
4. **CORS error** → `network_get_headers`
5. **Wrong data sent** → `network_get_body`
6. **Too many requests** → `network_get_requests` + `network_get_by_url`

---

**For full test results, see:** `FINAL_NETWORK_TOOLS_TEST_REPORT.md`
**For implementation details, see:** `src/tools/network-intelligence-tools.ts`
