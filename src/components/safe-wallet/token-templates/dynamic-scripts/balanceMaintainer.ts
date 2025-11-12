"use client";

export function buildBalanceMaintainerScript(options: {
  safeAddress: string;
  actionTarget: string;
  minimumBalanceEth: string;
  rpcUrl?: string;
  actionData?: string;
  operation?: number;
}): string {
  const {
    safeAddress,
    actionTarget,
    minimumBalanceEth,
    rpcUrl = "https://rpc.ankr.com/eth",
    actionData = "0x",
    operation = 0,
  } = options;

  // Script computes actionValue = max(minimumBalance - currentBalance(actionTarget), 0)
  // Uses eth_getBalance via JSON-RPC
  return `package main

import (
  "bytes"
  "encoding/hex"
  "encoding/json"
  "fmt"
  "log"
  "math/big"
  "net/http"
  "strings"
)

type rpcReq struct {
  JSONRPC string        \`json:"jsonrpc"\`
  Method  string        \`json:"method"\`
  Params  []interface{} \`json:"params"\`
  ID      int           \`json:"id"\`
}

type rpcRes struct {
  JSONRPC string     \`json:"jsonrpc"\`
  ID      int        \`json:"id"\`
  Result  string     \`json:"result"\`
  Error   *rpcError  \`json:"error"\`
}
type rpcError struct {
  Code    int    \`json:"code"\`
  Message string \`json:"message"\`
}

func weiFromHex(hexStr string) *big.Int {
  v := new(big.Int)
  // trim 0x
  hexStr = strings.TrimPrefix(strings.ToLower(hexStr), "0x")
  if hexStr == "" {
    return big.NewInt(0)
  }
  // Handle odd-length hex strings by padding with leading zero
  if len(hexStr)%2 != 0 {
    hexStr = "0" + hexStr
  }
  // decode hex
  b, err := hex.DecodeString(hexStr)
  if err != nil {
    return big.NewInt(0)
  }
  v.SetBytes(b)
  return v
}

func toWeiFromEthStr(eth string) *big.Int {
  // Convert string ETH (can be decimal) to wei as big.Int
  // Split integer and fraction
  parts := strings.SplitN(strings.TrimSpace(eth), ".", 2)
  intPart := parts[0]
  fracPart := ""
  if len(parts) == 2 {
    fracPart = parts[1]
  }
  if len(fracPart) > 18 {
    fracPart = fracPart[:18]
  }
  // right pad to 18
  fracPart = fracPart + strings.Repeat("0", 18-len(fracPart))
  // remove leading zeros properly
  intStr := strings.TrimLeft(intPart, "0")
  if intStr == "" {
    intStr = "0"
  }
  weiStr := intStr + fracPart
  // remove leading zeros again
  weiStr = strings.TrimLeft(weiStr, "0")
  if weiStr == "" {
    return big.NewInt(0)
  }
  v := new(big.Int)
  v.SetString(weiStr, 10)
  return v
}

func main() {
  safeAddress := "${safeAddress}"
  actionTarget := "${actionTarget}"
  rpcURL := "${rpcUrl}"
  minimumEth := "${minimumBalanceEth}"
  actionData := "${actionData}"
  operation := ${operation}

  // Fetch current balance
  body, _ := json.Marshal(rpcReq{
    JSONRPC: "2.0",
    Method:  "eth_getBalance",
    Params:  []interface{}{actionTarget, "latest"},
    ID:      1,
  })
  resp, err := http.Post(rpcURL, "application/json", bytes.NewReader(body))
  if err != nil {
    log.Println("eth_getBalance error:", err)
  }
  var out rpcRes
  if resp != nil && resp.Body != nil {
    defer resp.Body.Close()
    json.NewDecoder(resp.Body).Decode(&out)
  }
  var currentWei *big.Int = big.NewInt(0)
  if out.Error != nil {
    log.Printf("RPC Error: Code=%d, Message=%s", out.Error.Code, out.Error.Message)
  }
  if out.Error == nil && out.Result != "" {
    currentWei = weiFromHex(out.Result)
  }
  minimumWei := toWeiFromEthStr(minimumEth)

  // actionValue = max(minimumWei - currentWei, 0)
  actionValue := new(big.Int).Sub(minimumWei, currentWei)
  if actionValue.Sign() < 0 {
    actionValue = big.NewInt(0)
  }

  args := []interface{}{
    safeAddress,
    actionTarget,
    actionValue.String(),
    actionData,
    operation,
  }
  outJSON, _ := json.MarshalIndent(args, "", "  ")
  fmt.Println(string(outJSON))
}
`;
}
