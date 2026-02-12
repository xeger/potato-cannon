// src/services/__tests__/chat.service.idempotency.test.ts
import { describe, it, beforeEach, mock, Mock } from "node:test";
import assert from "node:assert";
import { ChatService } from "../chat.service.js";

// We test the internal idempotency logic by directly testing the ChatService
// Since the service has dependencies, we'll focus on the idempotency mechanism
// by testing the isDuplicateQuestion method behavior

describe("ChatService idempotency", () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService();
  });

  it("should detect duplicate questions within idempotency window", () => {
    // Access the private methods via casting
    const isDuplicateQuestion = (service as any).isDuplicateQuestion.bind(service);

    const contextKey = "test-project:brain_123";
    const question = "What is your favorite color?";

    // First call should NOT be a duplicate
    const firstResult = isDuplicateQuestion(contextKey, question);
    assert.strictEqual(firstResult, false, "First question should not be a duplicate");

    // Second call with same question immediately after SHOULD be a duplicate
    const secondResult = isDuplicateQuestion(contextKey, question);
    assert.strictEqual(secondResult, true, "Second identical question should be a duplicate");
  });

  it("should allow different questions", () => {
    const isDuplicateQuestion = (service as any).isDuplicateQuestion.bind(service);

    const contextKey = "test-project:brain_123";

    const result1 = isDuplicateQuestion(contextKey, "Question 1");
    assert.strictEqual(result1, false);

    const result2 = isDuplicateQuestion(contextKey, "Question 2");
    assert.strictEqual(result2, false, "Different question should not be a duplicate");
  });

  it("should allow same question after window expires (cache cleared)", () => {
    const isDuplicateQuestion = (service as any).isDuplicateQuestion.bind(service);

    const contextKey = "test-project:brain_123";
    const question = "What is your name?";

    // First call
    const result1 = isDuplicateQuestion(contextKey, question);
    assert.strictEqual(result1, false);

    // Clear the cache to simulate window expiry
    (service as any).recentQuestions.clear();

    // Second call after "window expired"
    const result2 = isDuplicateQuestion(contextKey, question);
    assert.strictEqual(result2, false, "Same question should be allowed after cache clear");
  });

  it("should track different contexts independently", () => {
    const isDuplicateQuestion = (service as any).isDuplicateQuestion.bind(service);

    const question = "What is your favorite color?";

    // First context
    const result1 = isDuplicateQuestion("project1:brain_1", question);
    assert.strictEqual(result1, false);

    // Different context with same question should NOT be a duplicate
    const result2 = isDuplicateQuestion("project1:brain_2", question);
    assert.strictEqual(result2, false, "Same question in different context should be allowed");
  });
});
