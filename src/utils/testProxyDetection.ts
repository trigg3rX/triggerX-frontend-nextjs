import {
  detectProxyAndGetImplementation,
  getProviderForChain,
} from "./proxyDetection";
import { devLog } from "@/lib/devLog";

// Test function to verify proxy detection works
export async function testProxyDetection() {
  // Known proxy contracts for testing (only using networks from networks.json)
  const testContracts = [
    {
      name: "Test Contract on OP Sepolia",
      address: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73", // The contract from your error
      chainId: 11155420, // OP Sepolia
      expectedType: null, // Unknown if it's a proxy
    },
    {
      name: "Regular Contract (not a proxy)",
      address: "0x0000000000000000000000000000000000000000", // Zero address
      chainId: 11155420, // OP Sepolia
      expectedType: null,
    },
  ];

  devLog("Starting proxy detection tests...");

  for (const testContract of testContracts) {
    try {
      devLog(`\nTesting: ${testContract.name}`);
      devLog(`Address: ${testContract.address}`);

      const provider = getProviderForChain(testContract.chainId);
      const result = await detectProxyAndGetImplementation(
        testContract.address,
        provider,
      );

      devLog(`Result:`, {
        isProxy: result.isProxy,
        implementationAddress: result.implementationAddress,
        proxyType: result.proxyType,
        error: result.error,
      });

      if (testContract.expectedType) {
        if (result.isProxy && result.proxyType === testContract.expectedType) {
          devLog(
            `✅ PASS: Correctly detected ${testContract.expectedType} proxy`,
          );
        } else {
          devLog(
            `❌ FAIL: Expected ${testContract.expectedType} proxy but got:`,
            result,
          );
        }
      } else {
        if (!result.isProxy) {
          devLog(`✅ PASS: Correctly identified as non-proxy`);
        } else {
          devLog(`❌ FAIL: Expected non-proxy but detected as proxy:`, result);
        }
      }
    } catch (error) {
      devLog(`❌ ERROR testing ${testContract.name}:`, error);
    }
  }

  devLog("\nProxy detection tests completed.");
}

// Function to test with a specific contract address
export async function testSpecificContract(address: string, chainId: number) {
  try {
    devLog(`Testing specific contract: ${address} on chain ${chainId}`);

    const provider = getProviderForChain(chainId);
    const result = await detectProxyAndGetImplementation(address, provider);

    devLog(`Result:`, {
      isProxy: result.isProxy,
      implementationAddress: result.implementationAddress,
      proxyType: result.proxyType,
      error: result.error,
    });

    return result;
  } catch (error) {
    devLog(`Error testing contract ${address}:`, error);
    return {
      isProxy: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
