# WebSee Network Intelligence

Network request analysis with timing, headers, body inspection, and request tracing.

## Quick Info

- **Tools**: 6 network analysis tools
- **Category**: Network debugging
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- **Content Types**: JSON, XML, text, form-urlencoded, multipart
- **Average Response Time**: 2.6s
- **Test Pass Rate**: 100%

## When to Use

- API requests failing (404, 500 errors)
- Need to trace which code made a request
- Performance issues with network calls
- CORS problems
- Authentication debugging
- Response data incorrect
- Duplicate or missing requests

## Tools Provided

1. **network_get_requests** - Get all HTTP requests
2. **network_get_by_url** - Filter requests by URL pattern
3. **network_get_timing** - Get detailed timing metrics
4. **network_trace_initiator** - Trace what triggered a request
5. **network_get_headers** - Get request/response headers
6. **network_get_body** - Get request/response body content

## Quick Start

```
# 1. Get all requests
network_get_requests → See all network activity

# 2. Filter by URL
network_get_by_url → Find specific endpoint

# 3. Analyze timing
network_get_timing → Check performance

# 4. Trace source
network_trace_initiator → Find what triggered request
```

## Documentation

- **[SKILL.md](./SKILL.md)** - Complete skill documentation

## Common Use Cases

### Debug Failed API
```
1. network_get_by_url → Find failed request
2. network_get_headers → Check request headers
3. network_get_body → See error response
4. network_trace_initiator → Find triggering code
```

### Performance Analysis
```
1. network_get_requests → Get all requests
2. network_get_timing → Find slow requests (>1s)
3. network_trace_initiator → Optimize slow endpoints
```

### CORS Issues
```
1. network_get_by_url → Find OPTIONS request
2. network_get_headers → Check CORS headers
3. network_get_timing → Verify preflight
```

## Performance

- **Average response time**: 2.6s
- **Range**: 1.9s - 3.8s
- **Success rate**: 100%
- **Test coverage**: All HTTP methods validated

## Integration

Works seamlessly with:
- **websee-component-intelligence** - Find which component made request
- **websee-source-intelligence** - Navigate to request code
- **websee-error-intelligence** - Get network context from errors

## Pattern Matching

Supports wildcard patterns:
- `/api/users/*` - All user endpoints
- `*/products` - Any products endpoint
- `https://api.example.com/*` - All API calls
- `*.json` - All JSON requests

## Version

- **Skill Version**: 1.0.0
- **Last Updated**: 2025-10-26
- **Status**: ✅ Production Ready
