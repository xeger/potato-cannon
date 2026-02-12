// src/utils/semver.ts

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

export type UpgradeType = "major" | "minor" | "patch";

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;

/**
 * Check if a string is a valid semver version.
 */
export function isValidSemver(version: string): boolean {
  return SEMVER_REGEX.test(version);
}

/**
 * Parse a semver string into components.
 * Throws if invalid.
 */
export function parseVersion(version: string): ParsedVersion {
  const match = version.match(SEMVER_REGEX);
  if (!match) {
    throw new Error(`Invalid semver: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Compare two semver versions.
 * Returns: negative if a < b, 0 if equal, positive if a > b
 */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);

  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

/**
 * Determine the upgrade type from current to available version.
 * Returns null if no upgrade needed (equal or current is newer).
 */
export function getUpgradeType(
  current: string,
  available: string
): UpgradeType | null {
  const vc = parseVersion(current);
  const va = parseVersion(available);

  // No upgrade if current >= available
  if (compareVersions(current, available) >= 0) {
    return null;
  }

  if (va.major > vc.major) return "major";
  if (va.minor > vc.minor) return "minor";
  return "patch";
}

/**
 * Convert legacy integer version to semver string.
 * 1 -> "1.0.0", 2 -> "2.0.0"
 */
export function legacyVersionToSemver(version: number): string {
  return `${version}.0.0`;
}

/**
 * Increment a semver version by type.
 */
export function incrementVersion(
  version: string,
  type: UpgradeType
): string {
  const v = parseVersion(version);
  switch (type) {
    case "major":
      return `${v.major + 1}.0.0`;
    case "minor":
      return `${v.major}.${v.minor + 1}.0`;
    case "patch":
      return `${v.major}.${v.minor}.${v.patch + 1}`;
  }
}
