import type { ModelSpec } from "../../types/template.types.js";

/**
 * Known model shortcuts that map to themselves (Claude CLI handles resolution)
 */
const MODEL_SHORTCUTS = ["haiku", "sonnet", "opus"] as const;

/**
 * Resolve a model specification to a CLI-ready string.
 * Returns null if no model specified (use Claude Code default).
 * Returns the model string if valid.
 * Logs warning and returns null for unrecognized models.
 *
 * @param model - The model specification from workflow config
 * @returns CLI-ready model string or null to use default
 */
export function resolveModel(model: ModelSpec | undefined): string | null {
  if (!model) return null;

  // String format: shortcut or explicit ID
  if (typeof model === "string") {
    // Empty string is invalid
    if (model === "") {
      return null;
    }

    // Shortcuts are passed directly to Claude CLI (it handles resolution)
    if (MODEL_SHORTCUTS.includes(model as (typeof MODEL_SHORTCUTS)[number])) {
      return model;
    }

    // Explicit model IDs (e.g., "claude-sonnet-4-20250514")
    if (model.startsWith("claude-")) {
      return model;
    }

    // Unrecognized model
    console.warn(`[resolveModel] Unrecognized model "${model}", using default`);
    return null;
  }

  // Object format: { id, provider? }
  if (typeof model === "object" && model.id) {
    // Empty id is invalid
    if (model.id === "") {
      return null;
    }

    // For now, only support Anthropic provider (or no provider specified)
    if (model.provider && model.provider !== "anthropic") {
      console.warn(
        `[resolveModel] Provider "${model.provider}" not supported, using default`
      );
      return null;
    }

    return model.id;
  }

  return null;
}
