/**
 * Sanitizes an object before including it in AI prompts.
 * Removes internal Mongoose/database keys (_id, __v, createdAt, updatedAt, embedding, version_history)
 * and formats as compact JSON without indentation whitespace.
 */
export function sanitizeForPrompt(obj: any): string {
  if (!obj) return "";

  const clean = (data: any): any => {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      return data.map(clean);
    }

    if (typeof data === "object") {
      // Handle Mongoose document toObject conversion
      const target = typeof data.toObject === "function" ? data.toObject() : data;
      const result: Record<string, any> = {};

      const excludedKeys = new Set([
        "_id",
        "__v",
        "createdAt",
        "updatedAt",
        "embedding",
        "version_history",
        "password",
      ]);

      for (const [key, val] of Object.entries(target)) {
        if (!excludedKeys.has(key) && val !== undefined && val !== null) {
          result[key] = clean(val);
        }
      }
      return result;
    }

    return data;
  };

  try {
    const cleanedObj = clean(obj);
    return JSON.stringify(cleanedObj);
  } catch (e) {
    return JSON.stringify(obj);
  }
}
