// Re-export types from store for backward compatibility
// These types are now defined in ralph-feedback.store.ts
export type {
  RalphFeedback,
  RalphFeedbackStatus,
  RalphIteration,
  CreateFeedbackInput,
  CreateIterationInput,
} from "../stores/ralph-feedback.store.js";

// Legacy type alias for code using old naming
// TODO: Remove after all consumers are updated
export type RalphFeedbackFile = import("../stores/ralph-feedback.store.js").RalphFeedback;
