import { describe, it, beforeEach, afterEach, before, after } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import os from "os";

import {
  waitForResponse,
  createWaitController,
  cancelWaitForResponse,
  writeResponse,
  clearResponse,
  clearQuestion,
} from "../chat.store.js";

// Override BRAINSTORMS_DIR for testing
const TEST_DIR = path.join(os.tmpdir(), `potato-chat-test-${Date.now()}`);

describe("chat.store cancellation", () => {
  const projectId = "test-project";
  const contextId = "brain_test123";

  before(async () => {
    // Create test directory
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  after(async () => {
    // Cleanup test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Clean up any existing test files for this context
    const safeProject = projectId.replace(/\//g, "__");
    const brainstormsDir = path.join(os.homedir(), ".potato-cannon", "brainstorms");
    const basePath = path.join(brainstormsDir, safeProject, contextId);
    try {
      await fs.rm(basePath, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  afterEach(() => {
    cancelWaitForResponse(contextId);
  });

  it("should cancel waitForResponse when abort signal is triggered", async () => {
    const controller = createWaitController(contextId);

    const waitPromise = waitForResponse(projectId, contextId, 10000, controller.signal);

    // Cancel after 100ms
    setTimeout(() => {
      cancelWaitForResponse(contextId);
    }, 100);

    await assert.rejects(
      waitPromise,
      { message: "Wait cancelled - session replaced" }
    );
  });

  it("should replace existing controller when creating a new one", () => {
    const controller1 = createWaitController(contextId);
    const controller2 = createWaitController(contextId);

    // First controller should be aborted
    assert.strictEqual(controller1.signal.aborted, true);
    assert.strictEqual(controller2.signal.aborted, false);
  });

  it("should return response when not cancelled", async () => {
    const controller = createWaitController(contextId);

    // Write response after 100ms
    setTimeout(async () => {
      await writeResponse(projectId, contextId, { answer: "test answer" });
    }, 100);

    const result = await waitForResponse(projectId, contextId, 10000, controller.signal);
    assert.strictEqual(result, "test answer");
  });

  it("should work without providing a signal (backwards compatibility)", async () => {
    // Write response after 100ms
    setTimeout(async () => {
      await writeResponse(projectId, contextId, { answer: "backwards compat" });
    }, 100);

    const result = await waitForResponse(projectId, contextId, 10000);
    assert.strictEqual(result, "backwards compat");
  });
});
