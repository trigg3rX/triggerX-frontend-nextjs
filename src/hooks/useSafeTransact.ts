import { useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

// Safe ABI for execTransaction
const SAFE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
      { internalType: "uint8", name: "operation", type: "uint8" },
      { internalType: "uint256", name: "safeTxGas", type: "uint256" },
      { internalType: "uint256", name: "baseGas", type: "uint256" },
      { internalType: "uint256", name: "gasPrice", type: "uint256" },
      { internalType: "address", name: "gasToken", type: "address" },
      {
        internalType: "address payable",
        name: "refundReceiver",
        type: "address",
      },
      { internalType: "bytes", name: "signatures", type: "bytes" },
    ],
    name: "execTransaction",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "nonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "domainSeparator",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
];

// ERC-20 ABI for transfer
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];

// EIP-712 TypeHash for Safe transactions
const SAFE_TX_TYPEHASH =
  "0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8";

export const useSafeTransact = () => {
  const [isSending, setIsSending] = useState(false);

  const executeSafeTransaction = async (
    safeAddress: string,
    to: string,
    value: bigint,
    data: string,
    operation: number = 0,
  ): Promise<boolean> => {
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const safeProxy = new ethers.Contract(safeAddress, SAFE_ABI, provider);

      // Get Safe's current nonce
      const safeNonce = await safeProxy.nonce();

      // Build Safe transaction parameters
      const safeTxGas = 0; // use all available gas
      const baseGas = 0; // no base gas
      const gasPrice = 0; // no gas refund
      const gasToken = ethers.ZeroAddress; // ETH
      const refundReceiver = ethers.ZeroAddress; // no refund

      // Calculate Safe transaction hash using EIP-712
      const safeTxHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          [
            "bytes32",
            "address",
            "uint256",
            "bytes32",
            "uint8",
            "uint256",
            "uint256",
            "uint256",
            "address",
            "address",
            "uint256",
          ],
          [
            SAFE_TX_TYPEHASH,
            to,
            value,
            ethers.keccak256(data),
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            safeNonce,
          ],
        ),
      );

      // Get domain separator from Safe
      const domainSeparator = await safeProxy.domainSeparator();

      // Create EIP-712 hash
      const txHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes1", "bytes1", "bytes32", "bytes32"],
          ["0x19", "0x01", domainSeparator, safeTxHash],
        ),
      );

      // Sign the transaction hash
      toast.loading("Please sign the transaction...", { id: "safe-tx" });
      const rawSignature = await signer.signMessage(ethers.getBytes(txHash));

      // Normalize signature and adjust v for Safe's EthSign type
      const sigObj = ethers.Signature.from(rawSignature);
      const adjustedV = sigObj.v + 4; // Safe expects v = 27/28 + 4 for EthSign
      const signature = ethers.concat([
        sigObj.r,
        sigObj.s,
        ethers.toBeHex(adjustedV, 1),
      ]);

      // Execute the transaction through Safe's execTransaction
      const safeProxyWithSigner = new ethers.Contract(
        safeAddress,
        SAFE_ABI,
        signer,
      );

      toast.loading("Executing transaction...", { id: "safe-tx" });
      const tx = await safeProxyWithSigner.execTransaction(
        to,
        value,
        data,
        operation,
        safeTxGas,
        baseGas,
        gasPrice,
        gasToken,
        refundReceiver,
        signature,
      );

      await tx.wait();
      toast.success("Transaction executed successfully!", { id: "safe-tx" });
      return true;
    } catch (error) {
      console.error("Error executing Safe transaction:", error);
      toast.error(
        error instanceof Error ? error.message : "Transaction failed",
        { id: "safe-tx" },
      );
      return false;
    }
  };

  const sendNativeFromSafe = async (
    safeAddress: string,
    recipient: string,
    amount: string,
  ): Promise<boolean> => {
    setIsSending(true);
    try {
      if (!ethers.isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      const value = ethers.parseEther(amount);
      if (value <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      const success = await executeSafeTransaction(
        safeAddress,
        recipient,
        value,
        "0x", // empty data for ETH transfer
        0, // call operation
      );

      return success;
    } catch (error) {
      console.error("Error sending native token:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send native token",
      );
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const sendErc20FromSafe = async (
    safeAddress: string,
    tokenAddress: string,
    recipient: string,
    amount: string,
    decimals: number,
  ): Promise<boolean> => {
    setIsSending(true);
    try {
      if (!ethers.isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      if (!ethers.isAddress(tokenAddress)) {
        throw new Error("Invalid token address");
      }

      const value = ethers.parseUnits(amount, decimals);
      if (value <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Encode ERC-20 transfer call data
      const erc20Interface = new ethers.Interface(ERC20_ABI);
      const data = erc20Interface.encodeFunctionData("transfer", [
        recipient,
        value,
      ]);

      const success = await executeSafeTransaction(
        safeAddress,
        tokenAddress,
        BigInt(0), // no ETH value for ERC-20 transfer
        data,
        0, // call operation
      );

      return success;
    } catch (error) {
      console.error("Error sending ERC-20 token:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send ERC-20 token",
      );
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendNativeFromSafe,
    sendErc20FromSafe,
    isSending,
  };
};
