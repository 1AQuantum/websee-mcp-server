/**
 * WebSee Intelligence Tools - Main Export
 *
 * This module provides a centralized export for all intelligence tools.
 *
 * @module tools
 */

// Component Intelligence Tools
export {
  // Tool functions
  componentTree,
  componentGetProps,
  componentGetState,
  componentFindByName,
  componentGetSource,
  componentTrackRenders,
  componentGetContext,
  componentGetHooks,

  // Schemas
  ComponentTreeSchema,
  ComponentGetPropsSchema,
  ComponentGetStateSchema,
  ComponentFindByNameSchema,
  ComponentGetSourceSchema,
  ComponentTrackRendersSchema,
  ComponentGetContextSchema,
  ComponentGetHooksSchema,

  // Tool definitions
  COMPONENT_INTELLIGENCE_TOOLS,
} from './component-intelligence-tools.js';

// Performance Intelligence Tools - REMOVED
// See FUTURE_DEVELOPMENT.md for implementation plan

// Error Intelligence Tools
export {
  // Tool functions
  errorResolveStack,
  errorGetContext,
  errorTraceCause,
  errorGetSimilar,

  // Schemas
  ErrorResolveStackSchema,
  ErrorGetContextSchema,
  ErrorTraceCauseSchema,
  ErrorGetSimilarSchema,

  // Types
  type ResolvedStackFrame,
  type ErrorContext,
  type RootCauseAnalysis,
  type SimilarError,

  // Default export
  errorIntelligenceTools,
} from './error-intelligence-tools.js';

// Network Intelligence Tools
export {
  // Tool functions
  networkGetRequests,
  networkGetByUrl,
  networkGetTiming,
  networkTraceInitiator,
  networkGetHeaders,
  networkGetBody,

  // Schemas
  NetworkGetRequestsSchema,
  NetworkGetByUrlSchema,
  NetworkGetTimingSchema,
  NetworkTraceInitiatorSchema,
  NetworkGetHeadersSchema,
  NetworkGetBodySchema,

  // Types
  type NetworkRequest,
  type NetworkTiming,
  type InitiatorTrace,
  type NetworkHeaders,
  type NetworkBody,

  // Tool definitions
  networkIntelligenceTools,
  createNetworkToolHandler,
} from './network-intelligence-tools.js';
