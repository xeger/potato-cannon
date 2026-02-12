import { describe, it } from "node:test";
import assert from "node:assert";
import type { OrchestrationState, RalphLoopState, TaskLoopState, AgentState } from "../../../types/orchestration.types.js";

describe("prepareForRecovery", () => {
  // Dynamic import to get the actual implementation
  const getModule = async () => import("../worker-state.js");

  it("should reset ralph loop when iteration >= maxAttempts", async () => {
    const { prepareForRecovery } = await getModule();

    const state: OrchestrationState = {
      phaseId: "Build",
      workerIndex: 0,
      activeWorker: {
        id: "test-ralph-loop",
        type: "ralphLoop",
        iteration: 2,
        maxAttempts: 2,
        workerIndex: 2,
        activeWorker: { id: "verifier", type: "agent" },
      } as RalphLoopState,
      updatedAt: new Date().toISOString(),
    };

    const result = prepareForRecovery(state);
    const ralphState = result.activeWorker as RalphLoopState;

    assert.strictEqual(ralphState.iteration, 1, "iteration should reset to 1");
    assert.strictEqual(ralphState.workerIndex, 0, "workerIndex should reset to 0");
    assert.strictEqual(ralphState.activeWorker, null, "activeWorker should be null");
  });

  it("should preserve iteration when below maxAttempts", async () => {
    const { prepareForRecovery } = await getModule();

    const state: OrchestrationState = {
      phaseId: "Build",
      workerIndex: 0,
      activeWorker: {
        id: "test-ralph-loop",
        type: "ralphLoop",
        iteration: 1,
        maxAttempts: 2,
        workerIndex: 1,
        activeWorker: { id: "agent", type: "agent", sessionId: "sess_123" },
      } as RalphLoopState,
      updatedAt: new Date().toISOString(),
    };

    const result = prepareForRecovery(state);
    const ralphState = result.activeWorker as RalphLoopState;

    // Has running agent, so workerIndex resets but iteration preserved
    assert.strictEqual(ralphState.iteration, 1, "iteration should stay 1");
    assert.strictEqual(ralphState.workerIndex, 0, "workerIndex should reset to 0");
  });

  it("should handle ralph loop without maxAttempts (backward compat)", async () => {
    const { prepareForRecovery } = await getModule();

    const state: OrchestrationState = {
      phaseId: "Build",
      workerIndex: 0,
      activeWorker: {
        id: "test-ralph-loop",
        type: "ralphLoop",
        iteration: 2,
        // No maxAttempts field
        workerIndex: 2,
        activeWorker: { id: "verifier", type: "agent" },
      } as RalphLoopState,
      updatedAt: new Date().toISOString(),
    };

    const result = prepareForRecovery(state);

    // No running agent and no maxAttempts, should return unchanged
    assert.strictEqual(result, state, "state should be unchanged");
  });

  it("should reset nested ralph loop inside task loop", async () => {
    const { prepareForRecovery } = await getModule();

    const state: OrchestrationState = {
      phaseId: "Build",
      workerIndex: 1,
      activeWorker: {
        id: "task-loop",
        type: "taskLoop",
        currentTaskId: "task-123",
        pendingTasks: ["task-456"],
        completedTasks: ["task-000"],
        workerIndex: 0,
        activeWorker: {
          id: "build-ralph-loop",
          type: "ralphLoop",
          iteration: 2,
          maxAttempts: 2,
          workerIndex: 2,
          activeWorker: { id: "verifier", type: "agent" },
        } as RalphLoopState,
      } as TaskLoopState,
      updatedAt: new Date().toISOString(),
    };

    const result = prepareForRecovery(state);
    const taskState = result.activeWorker as TaskLoopState;
    const ralphState = taskState.activeWorker as RalphLoopState;

    // Task loop state preserved
    assert.strictEqual(taskState.currentTaskId, "task-123");
    assert.deepStrictEqual(taskState.pendingTasks, ["task-456"]);
    assert.deepStrictEqual(taskState.completedTasks, ["task-000"]);

    // Ralph loop reset
    assert.strictEqual(ralphState.iteration, 1);
    assert.strictEqual(ralphState.workerIndex, 0);
    assert.strictEqual(ralphState.activeWorker, null);
  });
});
