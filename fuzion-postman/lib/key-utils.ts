/**
 * Shared utilities for generating consistent keys across the application
 */

/**
 * Generate a kebab-case key from a name with incremental number
 * Used for both individual API creation and bulk collection updates
 */
export function generateApiKey(
  name: string,
  incrementalNumber: number = 10
): string {
  const baseKey = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars except spaces and numbers
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Normalize multiple hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  const finalKey = `${baseKey}-${incrementalNumber}`;
  console.log("Generated key from name:", name, "->", finalKey);
  return finalKey;
}

/**
 * Generate a unique key for collection items
 * Ensures no duplicates in the same collection
 */
export function generateUniqueKey(
  name: string,
  existingKeys: string[] = []
): string {
  let incrementalNumber = 10;
  let key = generateApiKey(name, incrementalNumber);

  // If key already exists, increment the number until we find a unique one
  while (existingKeys.includes(key)) {
    incrementalNumber++;
    key = generateApiKey(name, incrementalNumber);
  }

  return key;
}

/**
 * Extract existing keys from collection items
 */
export function extractExistingKeys(items: any[]): string[] {
  return items.filter((item) => item.key).map((item) => item.key);
}

/**
 * Update keys for collection items to ensure consistency
 */
export function updateCollectionKeys(items: any[]): any[] {
  const existingKeys = extractExistingKeys(items);

  return items.map((item) => {
    // If item doesn't have a key or has an old format key, generate a new one
    if (!item.key || !item.key.includes("-")) {
      const newKey = generateUniqueKey(item.name || "unnamed", existingKeys);
      existingKeys.push(newKey);
      return { ...item, key: newKey };
    }
    return item;
  });
}
