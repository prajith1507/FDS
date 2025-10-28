export type JSONValue = string | number | boolean | null | JSONObject | JSONArray
export interface JSONObject {
  [k: string]: JSONValue
}
export interface JSONArray extends Array<JSONValue> {}

function mergeObjectsUnion(objs: Record<string, any>[]): Record<string, any> {
  const out: Record<string, any> = {}
  for (const obj of objs) {
    for (const k of Object.keys(obj || {})) {
      if (out[k] === undefined) {
        out[k] = obj[k]
      }
    }
  }
  return out
}

/**
 * Rules:
 * - Array of objects -> [singleMergedObject] (union of keys from all items)
 * - Array of primitives -> [firstItem]
 * - Object -> object as-is
 * - Other -> original value
 */
export function extractSample(value: any): any {
  if (Array.isArray(value)) {
    if (value.length === 0) return []
    const first = value[0]
    if (typeof first === "object" && first !== null && !Array.isArray(first)) {
      const merged = mergeObjectsUnion(
        value.filter((v) => typeof v === "object" && v && !Array.isArray(v)) as Record<string, any>[],
      )
      return [merged]
    }
    return [first]
  }
  if (typeof value === "object" && value !== null) return value
  return value
}
