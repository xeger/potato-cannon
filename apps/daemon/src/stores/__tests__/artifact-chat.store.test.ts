import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { artifactChatStore } from '../artifact-chat.store.js';

describe('ArtifactChatStore', () => {
  beforeEach(() => {
    artifactChatStore.clearAll();
  });

  afterEach(() => {
    artifactChatStore.stopCleanupTimer();
  });

  describe('createSession', () => {
    it('should create a new session with generated IDs', () => {
      const session = artifactChatStore.createSession(
        'test-project',
        'POT-1',
        'refinement.md'
      );

      assert.strictEqual(session.projectId, 'test-project');
      assert.strictEqual(session.ticketId, 'POT-1');
      assert.strictEqual(session.artifactFilename, 'refinement.md');
      assert.match(session.contextId, /^artchat_[a-f0-9]{16}$/);
      assert.strictEqual(session.active, true);
    });
  });

  describe('getSession', () => {
    it('should return session by contextId', () => {
      const created = artifactChatStore.createSession(
        'test-project',
        'POT-1',
        'refinement.md'
      );

      const retrieved = artifactChatStore.getSession(created.contextId);
      assert.deepStrictEqual(retrieved, created);
    });

    it('should return undefined for non-existent session', () => {
      const session = artifactChatStore.getSession('artchat_nonexistent');
      assert.strictEqual(session, undefined);
    });
  });

  describe('endSession', () => {
    it('should mark session as inactive with end reason', () => {
      const session = artifactChatStore.createSession(
        'test-project',
        'POT-1',
        'refinement.md'
      );

      artifactChatStore.endSession(session.contextId, 'completed');

      const ended = artifactChatStore.getSession(session.contextId);
      assert.strictEqual(ended?.active, false);
      assert.strictEqual(ended?.endReason, 'completed');
    });
  });

  describe('deleteSession', () => {
    it('should remove session from store', () => {
      const session = artifactChatStore.createSession(
        'test-project',
        'POT-1',
        'refinement.md'
      );

      artifactChatStore.deleteSession(session.contextId);

      assert.strictEqual(artifactChatStore.getSession(session.contextId), undefined);
    });
  });

  describe('getActiveSessionForArtifact', () => {
    it('should return active session for artifact', () => {
      const session = artifactChatStore.createSession(
        'test-project',
        'POT-1',
        'refinement.md'
      );

      const found = artifactChatStore.getActiveSessionForArtifact(
        'test-project',
        'POT-1',
        'refinement.md'
      );

      assert.deepStrictEqual(found, session);
    });

    it('should not return inactive session', () => {
      const session = artifactChatStore.createSession(
        'test-project',
        'POT-1',
        'refinement.md'
      );
      artifactChatStore.endSession(session.contextId, 'completed');

      const found = artifactChatStore.getActiveSessionForArtifact(
        'test-project',
        'POT-1',
        'refinement.md'
      );

      assert.strictEqual(found, undefined);
    });
  });
});
