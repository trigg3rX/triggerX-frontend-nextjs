export interface ApiKey {
  name: string;
  value: string;
  originalValue: string;
  description?: string;
}

export async function fetchApiKeys(apiUrl: string): Promise<ApiKey[]> {
  try {
    // Validate URL
    if (!apiUrl || !/^https?:\/\//.test(apiUrl)) {
      throw new Error("Invalid URL format");
    }

    // Make a request to the API to get available keys
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Try to extract keys from common API response patterns
    const keys: ApiKey[] = [];
    const usedValues = new Set<string>();

    // Pattern 1: Direct array of keys
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (typeof item === "string") {
          const value = item;
          if (!usedValues.has(value)) {
            usedValues.add(value);
            keys.push({
              name: `Key ${index + 1}`,
              value: value,
              originalValue: value,
              description: `API key from ${apiUrl}`,
            });
          }
        } else if (typeof item === "object" && item !== null) {
          // Handle object with name/value structure
          const name = item.name || item.key || item.id || `Key ${index + 1}`;
          const rawValue = item.value || item.data || item.result || item;
          const originalValue =
            typeof rawValue === "object"
              ? JSON.stringify(rawValue)
              : String(rawValue);
          const uniqueValue = usedValues.has(originalValue)
            ? `${originalValue}_${index}`
            : originalValue;
          if (!usedValues.has(uniqueValue)) {
            usedValues.add(uniqueValue);
            keys.push({
              name,
              value: uniqueValue,
              originalValue: originalValue,
              description: item.description || `API key from ${apiUrl}`,
            });
          }
        }
      });
    }
    // Pattern 2: Object with keys property
    else if (typeof data === "object" && data !== null) {
      if (data.keys && Array.isArray(data.keys)) {
        data.keys.forEach((key: Record<string, unknown>, index: number) => {
          const rawValue = key.value || key;
          const originalValue =
            typeof rawValue === "object"
              ? JSON.stringify(rawValue)
              : String(rawValue);
          const uniqueValue = usedValues.has(originalValue)
            ? `${originalValue}_${index}`
            : originalValue;
          if (!usedValues.has(uniqueValue)) {
            usedValues.add(uniqueValue);
            keys.push({
              name: (key.name as string) || `Key ${index + 1}`,
              value: uniqueValue,
              originalValue: originalValue,
              description:
                (key.description as string) || `API key from ${apiUrl}`,
            });
          }
        });
      }
      // Pattern 3: Object with data property
      else if (data.data && Array.isArray(data.data)) {
        data.data.forEach((item: Record<string, unknown>, index: number) => {
          const rawValue = item.value || item;
          const value =
            typeof rawValue === "object"
              ? JSON.stringify(rawValue)
              : String(rawValue);
          const uniqueValue = usedValues.has(value)
            ? `${value}_${index}`
            : value;
          if (!usedValues.has(uniqueValue)) {
            usedValues.add(uniqueValue);
            keys.push({
              name: (item.name as string) || `Key ${index + 1}`,
              value: uniqueValue,
              originalValue: value,
              description:
                (item.description as string) || `API key from ${apiUrl}`,
            });
          }
        });
      }
      // Pattern 4: Single value in response
      else if (data.value || data.result || data.key) {
        const rawValue = data.value || data.result || data.key;
        const value =
          typeof rawValue === "object"
            ? JSON.stringify(rawValue)
            : String(rawValue);
        const uniqueValue = usedValues.has(value) ? `${value}_single` : value;
        if (!usedValues.has(uniqueValue)) {
          usedValues.add(uniqueValue);
          keys.push({
            name: data.name || "API Key",
            value: uniqueValue,
            originalValue: value,
            description: data.description || `API key from ${apiUrl}`,
          });
        }
      }
      // Pattern 5: Flatten object properties
      else {
        Object.entries(data).forEach(([key, value], index) => {
          if (value !== null && value !== undefined) {
            // Handle nested objects properly
            let stringValue: string;
            if (typeof value === "object") {
              // For nested objects, try to extract meaningful values
              if (typeof value === "object" && value !== null) {
                // If it's an object with nested properties, create separate keys for each
                Object.entries(value).forEach(
                  ([nestedKey, nestedValue], nestedIndex) => {
                    const nestedStringValue = String(nestedValue);
                    const uniqueValue = usedValues.has(nestedStringValue)
                      ? `${nestedStringValue}_${index}_${nestedIndex}`
                      : nestedStringValue;
                    if (!usedValues.has(uniqueValue)) {
                      usedValues.add(uniqueValue);
                      keys.push({
                        name: `${key}.${nestedKey}`,
                        value: uniqueValue,
                        originalValue: nestedStringValue,
                        description: `API key from ${apiUrl}`,
                      });
                    }
                  },
                );
                return; // Skip the outer loop for this nested object
              } else {
                stringValue = JSON.stringify(value);
              }
            } else {
              stringValue = String(value);
            }

            const uniqueValue = usedValues.has(stringValue)
              ? `${stringValue}_${index}`
              : stringValue;
            if (!usedValues.has(uniqueValue)) {
              usedValues.add(uniqueValue);
              keys.push({
                name: key,
                value: uniqueValue,
                originalValue: stringValue,
                description: `API key from ${apiUrl}`,
              });
            }
          }
        });
      }
    }

    // If no keys found, create a default key from the response
    if (keys.length === 0) {
      keys.push({
        name: "Default Key",
        value: JSON.stringify(data),
        originalValue: JSON.stringify(data),
        description: `Response from ${apiUrl}`,
      });
    }

    return keys;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    throw new Error(
      `${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
