import { describe, it } from "node:test";
import assert from "node:assert";
import {
  parseVersion,
  compareVersions,
  getUpgradeType,
  isValidSemver,
} from "../semver.js";

describe("semver utilities", () => {
  describe("isValidSemver", () => {
    it("returns true for valid semver", () => {
      assert.strictEqual(isValidSemver("1.0.0"), true);
      assert.strictEqual(isValidSemver("0.0.1"), true);
      assert.strictEqual(isValidSemver("10.20.30"), true);
    });

    it("returns false for invalid semver", () => {
      assert.strictEqual(isValidSemver("1"), false);
      assert.strictEqual(isValidSemver("1.0"), false);
      assert.strictEqual(isValidSemver("v1.0.0"), false);
      assert.strictEqual(isValidSemver("1.0.0-beta"), false);
    });
  });

  describe("parseVersion", () => {
    it("parses valid semver string", () => {
      assert.deepStrictEqual(parseVersion("1.2.3"), { major: 1, minor: 2, patch: 3 });
      assert.deepStrictEqual(parseVersion("0.0.0"), { major: 0, minor: 0, patch: 0 });
    });

    it("throws for invalid semver", () => {
      assert.throws(() => parseVersion("invalid"));
      assert.throws(() => parseVersion("1.0"));
    });
  });

  describe("compareVersions", () => {
    it("returns 0 for equal versions", () => {
      assert.strictEqual(compareVersions("1.0.0", "1.0.0"), 0);
    });

    it("returns positive when a > b", () => {
      assert.ok(compareVersions("2.0.0", "1.0.0") > 0);
      assert.ok(compareVersions("1.1.0", "1.0.0") > 0);
      assert.ok(compareVersions("1.0.1", "1.0.0") > 0);
    });

    it("returns negative when a < b", () => {
      assert.ok(compareVersions("1.0.0", "2.0.0") < 0);
      assert.ok(compareVersions("1.0.0", "1.1.0") < 0);
      assert.ok(compareVersions("1.0.0", "1.0.1") < 0);
    });
  });

  describe("getUpgradeType", () => {
    it("returns null when versions are equal", () => {
      assert.strictEqual(getUpgradeType("1.0.0", "1.0.0"), null);
    });

    it("returns null when current is newer", () => {
      assert.strictEqual(getUpgradeType("2.0.0", "1.0.0"), null);
    });

    it("returns 'major' for major version bump", () => {
      assert.strictEqual(getUpgradeType("1.0.0", "2.0.0"), "major");
      assert.strictEqual(getUpgradeType("1.9.9", "2.0.0"), "major");
    });

    it("returns 'minor' for minor version bump", () => {
      assert.strictEqual(getUpgradeType("1.0.0", "1.1.0"), "minor");
      assert.strictEqual(getUpgradeType("1.0.9", "1.1.0"), "minor");
    });

    it("returns 'patch' for patch version bump", () => {
      assert.strictEqual(getUpgradeType("1.0.0", "1.0.1"), "patch");
      assert.strictEqual(getUpgradeType("1.0.0", "1.0.99"), "patch");
    });
  });
});
