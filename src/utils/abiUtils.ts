import { devLog } from "@/lib/devLog";

/**
 * Represents an ABI item (function, event, constructor, etc.)
 */
export interface ABIItem {
  type: string;
  name?: string;
  inputs?: ABIInput[];
  outputs?: ABIOutput[];
  stateMutability?: string;
  payable?: boolean;
  constant?: boolean;
  anonymous?: boolean;
}

/**
 * Represents a function/event input parameter
 */
export interface ABIInput {
  name?: string;
  type: string;
  indexed?: boolean;
  components?: ABIInput[]; // For tuple types
  internalType?: string;
}

/**
 * Represents a function output parameter
 */
export interface ABIOutput {
  name?: string;
  type: string;
  components?: ABIOutput[]; // For tuple types
  internalType?: string;
}

/**
 * Represents a parsed function from an ABI
 */
export interface ParsedFunction {
  name: string;
  inputs: ABIInput[];
  outputs?: ABIOutput[];
  stateMutability?: string;
  payable?: boolean;
  constant?: boolean;
}

/**
 * Represents a parsed event from an ABI
 */
export interface ParsedEvent {
  name: string;
  inputs: ABIInput[];
  anonymous?: boolean;
}

/**
 * Result of parsing an ABI string
 */
export interface ParseABIResult {
  success: boolean;
  abi?: ABIItem[];
  functions?: ParsedFunction[];
  events?: ParsedEvent[];
  error?: string;
}

/**
 * Parses an ABI string and returns the parsed ABI array
 * @param abiString - The ABI string to parse (JSON format)
 * @returns ParseABIResult with success status and parsed data or error
 */
export function parseABI(abiString: string): ParseABIResult {
  try {
    if (!abiString || abiString.trim() === "") {
      return {
        success: false,
        error: "ABI string is empty",
      };
    }

    const parsed = JSON.parse(abiString);

    if (!Array.isArray(parsed)) {
      return {
        success: false,
        error: "ABI must be an array",
      };
    }

    return {
      success: true,
      abi: parsed,
    };
  } catch (error) {
    devLog("[parseABI] Error parsing ABI:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse ABI",
    };
  }
}

/**
 * Extracts functions from an ABI string or array
 * @param abi - The ABI as a string (JSON) or array
 * @param filterPayable - If true, only include payable and nonpayable functions (exclude view/pure)
 * @returns Array of parsed functions
 */
export function extractFunctions(
  abi: string | ABIItem[],
  filterPayable: boolean = false,
): ParsedFunction[] {
  try {
    let abiArray: ABIItem[];

    if (typeof abi === "string") {
      const parseResult = parseABI(abi);
      if (!parseResult.success || !parseResult.abi) {
        return [];
      }
      abiArray = parseResult.abi;
    } else if (Array.isArray(abi)) {
      abiArray = abi;
    } else {
      devLog("[extractFunctions] Invalid ABI format");
      return [];
    }

    let functions = abiArray
      .filter((item) => item && item.type === "function")
      .map((func) => ({
        name: func.name || "unnamed",
        inputs: func.inputs || [],
        outputs: func.outputs || [],
        stateMutability: func.stateMutability || "nonpayable",
        payable: func.payable || false,
        constant: func.constant || false,
      }));

    // Filter for payable/nonpayable only if requested
    if (filterPayable) {
      functions = functions.filter(
        (func) =>
          func.stateMutability === "nonpayable" ||
          func.stateMutability === "payable",
      );
    }

    return functions;
  } catch (error) {
    devLog("[extractFunctions] Error processing ABI:", error);
    return [];
  }
}

/**
 * Extracts events from an ABI string or array
 * @param abi - The ABI as a string (JSON) or array
 * @returns Array of parsed events
 */
export function extractEvents(abi: string | ABIItem[]): ParsedEvent[] {
  try {
    let abiArray: ABIItem[];

    if (typeof abi === "string") {
      const parseResult = parseABI(abi);
      if (!parseResult.success || !parseResult.abi) {
        return [];
      }
      abiArray = parseResult.abi;
    } else if (Array.isArray(abi)) {
      abiArray = abi;
    } else {
      devLog("[extractEvents] Invalid ABI format");
      return [];
    }

    return abiArray
      .filter((item) => item && item.type === "event")
      .map((event) => ({
        name: event.name || "unnamed",
        inputs: event.inputs || [],
        anonymous: event.anonymous || false,
      }));
  } catch (error) {
    devLog("[extractEvents] Error processing ABI:", error);
    return [];
  }
}

/**
 * Generates a function signature from function name and inputs
 * @param functionName - Name of the function
 * @param inputs - Array of function inputs
 * @returns Function signature in the format "functionName(type1,type2,...)"
 */
export function getFunctionSignature(
  functionName: string,
  inputs: ABIInput[],
): string {
  const inputTypes = inputs.map((input) => input.type).join(",");
  return `${functionName}(${inputTypes})`;
}

/**
 * Finds a function in the ABI by its signature
 * @param functions - Array of parsed functions
 * @param signature - Function signature to find
 * @returns The matching function or undefined
 */
export function findFunctionBySignature(
  functions: ParsedFunction[],
  signature: string,
): ParsedFunction | undefined {
  return functions.find((func) => {
    const funcSig = getFunctionSignature(func.name, func.inputs);
    return funcSig === signature;
  });
}

/**
 * Validates if a string is a valid ABI JSON
 * @param abiString - The ABI string to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateABI(abiString: string): {
  isValid: boolean;
  error?: string;
} {
  if (!abiString || abiString.trim() === "") {
    return { isValid: false, error: "ABI is required" };
  }

  try {
    const parsed = JSON.parse(abiString);

    if (!Array.isArray(parsed)) {
      return { isValid: false, error: "ABI must be a JSON array" };
    }

    if (parsed.length === 0) {
      return { isValid: false, error: "ABI array is empty" };
    }

    // Check if at least one item has a type field
    const hasValidItems = parsed.some(
      (item) => item && typeof item === "object" && "type" in item,
    );

    if (!hasValidItems) {
      return {
        isValid: false,
        error: "ABI must contain valid items with 'type' field",
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: "Invalid JSON format",
    };
  }
}

/**
 * Formats a function for display in a dropdown or list
 * @param func - The parsed function
 * @returns Object with id (signature) and name for display
 */
export function formatFunctionForDisplay(func: ParsedFunction): {
  id: string;
  name: string;
} {
  return {
    id: getFunctionSignature(func.name, func.inputs),
    name: func.name,
  };
}

/**
 * Extracts all functions from ABI and formats them for dropdown display
 * @param abi - The ABI as a string (JSON) or array
 * @param filterPayable - If true, only include payable and nonpayable functions
 * @returns Array of formatted functions ready for dropdown options
 */
export function getFunctionsForDropdown(
  abi: string | ABIItem[],
  filterPayable: boolean = false,
): { id: string; name: string }[] {
  const functions = extractFunctions(abi, filterPayable);
  return functions.map(formatFunctionForDisplay);
}
