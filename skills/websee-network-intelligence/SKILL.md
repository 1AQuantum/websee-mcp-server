---
name: websee-network-intelligence
description: Analyze HTTP requests, timing, headers, and initiator traces for debugging API calls, performance optimization, and request source tracing.
---

# WebSee Network Intelligence Skill

Master network debugging with 6 tools for inspecting HTTP requests, performance timing, request origins, headers, and payloads.

## When to Use This Skill

- API calls fail or return unexpected responses
- Debug CORS, authentication, or header issues
- Investigate slow network performance
- Find which code triggers specific requests
- Analyze request/response payloads
- Optimize network waterfall and load times

## Core Tool Reference

### 1. network_get_requests - All Network Requests

Get comprehensive list of all HTTP requests with detailed metadata.

**Input**: `{ url: string; waitTime?: number }`

**Output**: Array of requests with url, method, status, duration, size, timestamp, initiator, stackTrace, headers

**Example**: `Use network_get_requests on https://jsonplaceholder.typicode.com/posts`

**Best for**: Initial network analysis, finding all API endpoints, identifying failed or slow requests

---

### 2. network_get_by_url - Filter by URL Pattern

Filter requests using URL patterns with wildcard support.

**Input**: `{ url: string; pattern: string }` - Pattern examples: `/api/*`, `*.json`, `*users*`

**Output**: Filtered array of requests with url, method, status, duration, timestamp, initiator

**Example**: `Use network_get_by_url on https://app.com Pattern: /api/users/*`

**Best for**: Targeted filtering, API endpoint isolation, finding specific file types

---

### 3. network_get_timing - Request Timing Details

Get detailed performance timing breakdown for a specific request.

**Input**: `{ url: string; requestUrl: string }`

**Output**: `{ dns, connect, ssl, ttfb, download, total }` (all in milliseconds)

**Example**: `Use network_get_timing on https://app.com Request URL: https://api.app.com/data.json`

**Timing Metrics**:
- **dns** - Domain lookup (target: < 20ms)
- **connect** - TCP connection (target: < 50ms)
- **ssl** - HTTPS handshake (target: < 100ms)
- **ttfb** - Time to first byte (target: < 200ms API, < 500ms complex)
- **download** - Data transfer (varies by size)
- **total** - End-to-end duration

**Best for**: Performance debugging, identifying bottlenecks (DNS, SSL, TTFB, download)

---

### 4. network_trace_initiator - Request Source Tracing

Trace a network request to the source code that triggered it.

**Input**: `{ url: string; requestUrl: string }`

**Output**: `{ file, line, column, function?, stackTrace[] }` - Full call stack with source locations

**Example**: `Use network_trace_initiator on https://app.com Request URL: https://api.app.com/users/123`

**Best for**: Finding which code makes requests, debugging duplicate or unwanted requests, locating fetch/XHR calls

---

### 5. network_get_headers - Request/Response Headers

Get complete HTTP headers for request and response.

**Input**: `{ url: string; requestUrl: string }`

**Output**: `{ requestHeaders, responseHeaders }` - All HTTP headers as key-value pairs

**Example**: `Use network_get_headers on https://app.com Request URL: https://api.app.com/protected/data`

**Common Headers**:
- **Request**: authorization, content-type, accept, user-agent, origin, cookie
- **Response**: content-type, content-length, cache-control, access-control-allow-origin, set-cookie
- **CORS**: access-control-allow-{origin,methods,headers,credentials}

**Best for**: CORS debugging, authentication verification, cache analysis, security headers

---

### 6. network_get_body - Request/Response Body

Get full request payload and response body content.

**Input**: `{ url: string; requestUrl: string }`

**Output**: `{ requestBody, responseBody, contentType }` - Full payload data as strings

**Example**: `Use network_get_body on https://app.com Request URL: https://api.app.com/users`

**Supported Content Types**: JSON, form-urlencoded, multipart/form-data, plain text, HTML, XML

**Best for**: Payload debugging, API validation, verifying JSON data, analyzing form submissions

---

## Common Workflows

### 1. Debug Failed API Call
```
Problem: API returns 404/500
Steps:
  1. network_get_requests → Find failed request
  2. network_get_headers → Check auth/content-type
  3. network_get_body → Verify payload
  4. network_trace_initiator → Navigate to code
```

### 2. Performance Optimization
```
Problem: Slow page load
Steps:
  1. network_get_requests → Sort by duration
  2. network_get_timing → Analyze bottlenecks (DNS, TTFB, download)
  3. network_get_by_url → Group by endpoint
  4. Optimize: High DNS→CDN, High TTFB→caching, High Download→compression
```

### 3. Debug CORS Issue
```
Problem: CORS blocks request
Steps:
  1. network_get_requests → Find CORS error
  2. network_get_headers → Check access-control-* headers
  3. Fix server CORS config (allow-origin, allow-methods, allow-headers)
```

### 4. Find Duplicate Requests
```
Problem: Same API called 3x
Steps:
  1. network_get_requests → Count duplicates
  2. network_get_by_url → Filter endpoint
  3. network_trace_initiator → Find all sources
  4. Implement deduplication/caching
```

### 5. Debug Authentication
```
Problem: 401 Unauthorized
Steps:
  1. network_get_headers → Check Authorization header
  2. Verify "Bearer <token>" format
  3. network_trace_initiator → Find token source
```

---

## Troubleshooting

**"Request not found"**: Use `network_get_requests` first to find exact URL (include query params). Increase `waitTime` if needed.

**"No stack trace available"**: Parser-initiated requests (img, script tags) don't have stacks. Only fetch/XHR have traces.

**"Response body not available"**: Binary content or already-consumed responses may fail. Check `contentType` or use headers.

**Timing data all zeros**: Increase `waitTime` or try fresh page load (no cache).

---

## Performance Considerations

**Response Times**: 2.6s average (1.9s-3.8s range)

**Wait Time Guidelines**:
- Simple pages: 2000ms
- API-heavy SPAs: 3000-5000ms
- Lazy-loaded: 5000-10000ms

**Best Practices**:
- Start with `network_get_requests` for overview
- Filter early with `network_get_by_url` for large pages
- Cache request list to avoid repeated page loads
- 100% test pass rate on all HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)

---

## Integration with Other Skills

**Combine with**:
- `websee-component-intelligence` → Find which component makes requests
- `websee-source-intelligence` → Navigate to source from stack traces
- `websee-error-intelligence` → Debug network-related errors

**Multi-Skill Examples**:

**API Error in Component**:
`error_get_context → network_get_requests → network_get_body → component_get_state → network_trace_initiator`

**Performance Investigation**:
`network_get_requests → network_get_timing → component_track_renders → source_map_resolve`

**CORS Debugging**:
`network_get_requests → network_get_headers → network_trace_initiator → component_get_props`

---

## Real-World Examples

**API Endpoint Changed**: `/api/v1/*` → `/api/v2/*`
1. `network_get_requests` → Find 404s
2. `network_get_by_url pattern="/api/v1/*"` → List old endpoints
3. `network_trace_initiator` → Find calling code
4. Update to v2

**Slow Dashboard**: 8s → 3s
1. `network_get_requests` → Sort by duration
2. `network_get_timing` → Find 5s TTFB
3. `network_trace_initiator` → Find sequential calls
4. Refactor to parallel → 3s total

**Missing Data**: Empty response despite 200 OK
1. `network_get_body` → Response is `[]`
2. `network_get_headers` → Missing authorization
3. Add auth header → data loads

---

## Pattern Matching Examples

**`network_get_by_url` supports wildcards**:
- `/api/*` → All API requests
- `*.json` → All JSON files
- `*users*` → Requests containing "users"
- `https://api.app.com/*` → Specific domain
- `/api/v?/*` → /api/v1/*, /api/v2/*

---

**Skill Version**: 1.0.0
**Tools**: 6 (100% pass rate, 12/12 tests)
**Response Time**: 2.6s average
**HTTP Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
