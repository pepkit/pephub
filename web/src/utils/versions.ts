/**
 * Checks if a string is a valid semantic version (semver) format
 * @param version - The string to validate
 * @returns boolean indicating if the input is a valid semver string
 */
export function isSemanticVersion(version: string): boolean {
  // Regular expression for semantic versioning (MAJOR.MINOR.PATCH)
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  
  return semverRegex.test(version);
}

/**
 * Increments the minor version of a semantic version string
 * @param version - The semver string to increment
 * @returns The version with incremented minor version or the original input if invalid
 */
export function incrementMinorVersion(version: string): string {
  if (!isSemanticVersion(version)) {
    return version; // Return original if invalid
  }

  const parts = version.split('.');
  
  if (parts.length >= 2) {
    // Parse the minor version to a number, increment it, and convert back to string
    const minor = parseInt(parts[1], 10);
    parts[1] = (minor + 1).toString();
    
    // Reset patch version to 0 when incrementing minor version (following semver conventions)
    if (parts.length >= 3) {
      // Split at any pre-release or build metadata
      const patchParts = parts[2].split(/[-+]/);
      parts[2] = '0' + (patchParts.length > 1 ? parts[2].substring(patchParts[0].length) : '');
    }
  }
  
  return parts.join('.');
}
