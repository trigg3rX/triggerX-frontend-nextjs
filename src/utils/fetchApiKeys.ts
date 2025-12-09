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

    // Parse URL to check origin
    let urlObj: URL;
    let isCrossOrigin = false;
    try {
      urlObj = new URL(apiUrl);
      if (typeof window !== "undefined") {
        const currentOrigin = window.location.origin;
        isCrossOrigin = urlObj.origin !== currentOrigin;
      }
    } catch {
      throw new Error("Invalid URL format");
    }

    // If cross-origin request, use proxy API route
    let response: Response;
    let actualUrl = apiUrl;

    if (isCrossOrigin && typeof window !== "undefined") {
      const proxyUrl = `/api/proxy-api-keys?url=${encodeURIComponent(apiUrl)}`;
      actualUrl = proxyUrl;
    }

    // Make a request to the API to get available keys
    const fetchOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      response = await fetch(actualUrl, fetchOptions);
    } catch (fetchError) {
      throw fetchError;
    }

    if (!response.ok) {
      // Try to get error body - prioritize showing actual error message
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorText = await response.text();

        // If using proxy, extract the error message from proxy response
        if (isCrossOrigin && typeof window !== "undefined") {
          try {
            const errorData = JSON.parse(errorText);
            // Prioritize error field, then message field
            if (errorData.error && typeof errorData.error === "string") {
              errorMessage = errorData.error;
            } else if (
              errorData.message &&
              typeof errorData.message === "string"
            ) {
              errorMessage = errorData.message;
            }
          } catch {
            // If not JSON, use error text if it's reasonable
            if (errorText && errorText.trim() && errorText.length < 500) {
              errorMessage = errorText;
            }
          }
        } else {
          // For non-proxy errors, try to parse error text
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error && typeof errorData.error === "string") {
              errorMessage = errorData.error;
            } else if (
              errorData.message &&
              typeof errorData.message === "string"
            ) {
              errorMessage = errorData.message;
            }
          } catch {
            // If not JSON, use error text if it's reasonable
            if (errorText && errorText.trim() && errorText.length < 500) {
              errorMessage = errorText;
            }
          }
        }
      } catch {
        // If we can't read error body, use default message
      }

      throw new Error(errorMessage);
    }

    let data: unknown;
    try {
      const responseText = await response.text();

      try {
        data = JSON.parse(responseText);

        // If using proxy and response has error field, throw it
        if (
          isCrossOrigin &&
          typeof window !== "undefined" &&
          typeof data === "object" &&
          data !== null
        ) {
          const dataObj = data as Record<string, unknown>;
          if (dataObj.error && typeof dataObj.error === "string") {
            throw new Error(`Proxy error: ${dataObj.error}`);
          }
        }
      } catch (parseError) {
        // If it's our custom error, rethrow it
        if (
          parseError instanceof Error &&
          parseError.message.includes("Proxy error")
        ) {
          throw parseError;
        }
        throw parseError;
      }
    } catch (textError) {
      // If it's our custom error, rethrow it
      if (
        textError instanceof Error &&
        textError.message.includes("Proxy error")
      ) {
        throw textError;
      }
      throw textError;
    }

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
      const dataObj = data as Record<string, unknown>;
      if (dataObj.keys && Array.isArray(dataObj.keys)) {
        dataObj.keys.forEach((key: Record<string, unknown>, index: number) => {
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
      else if (dataObj.data && Array.isArray(dataObj.data)) {
        dataObj.data.forEach((item: Record<string, unknown>, index: number) => {
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
      else if (dataObj.value || dataObj.result || dataObj.key) {
        const rawValue = dataObj.value || dataObj.result || dataObj.key;
        const value =
          typeof rawValue === "object"
            ? JSON.stringify(rawValue)
            : String(rawValue);
        const uniqueValue = usedValues.has(value) ? `${value}_single` : value;
        if (!usedValues.has(uniqueValue)) {
          usedValues.add(uniqueValue);
          keys.push({
            name: (dataObj.name as string) || "API Key",
            value: uniqueValue,
            originalValue: value,
            description:
              (dataObj.description as string) || `API key from ${apiUrl}`,
          });
        }
      }
      // Pattern 5: Flatten object properties
      else {
        Object.entries(dataObj).forEach(([key, value], index) => {
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
    throw new Error(
      `${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
