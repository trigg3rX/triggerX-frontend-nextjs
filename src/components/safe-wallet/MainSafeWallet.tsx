"use client";

import React, { useMemo, useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownOption } from "@/components/ui/Dropdown";
import Skeleton from "@/components/ui/Skeleton";
import ShortAddress from "@/components/ui/ShortAddress";
import { useAccount } from "wagmi";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import {
  getWalletDisplayName,
  saveWalletName,
  deleteWalletName,
} from "@/utils/safeWalletNames";

type TabKey = "wallets" | "modules" | "jobs" | "tokens" | "templates";

const TABS: { key: TabKey; label: string }[] = [
  { key: "wallets", label: "Wallets" },
  { key: "modules", label: "Modules" },
  { key: "jobs", label: "Jobs" },
  { key: "tokens", label: "Tokens" },
  { key: "templates", label: "Templates" },
];

const Page: React.FC = () => {
  const { address } = useAccount();
  const { safeWallets, isLoading, error, refetch } = useSafeWallets();
  const { createSafeWallet, enableModule, isCreating, isEnablingModule } =
    useCreateSafeWallet();

  const [activeTab, setActiveTab] = useState<TabKey>("wallets");
  const [selectedSafe, setSelectedSafe] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const dropdownOptions: DropdownOption[] = useMemo(
    () => [
      ...safeWallets.map((w) => ({ id: w, name: getWalletDisplayName(w) })),
      { id: "create-new", name: "+ Create New Safe Wallet" },
      { id: "import", name: "Import Existing Safe" },
    ],
    [safeWallets],
  );

  const selectedOption = selectedSafe
    ? getWalletDisplayName(selectedSafe)
    : "Select a Safe Wallet";

  const handleSelect = async (opt: DropdownOption) => {
    if (opt.id === "create-new") {
      if (!address) return;
      const newSafe = await createSafeWallet(address);
      if (newSafe) {
        setTimeout(async () => {
          await refetch();
          setSelectedSafe(newSafe);
        }, 2500);
      }
      return;
    }
    if (opt.id === "import") {
      const input = prompt("Enter Safe address to import");
      if (input && /^0x[a-fA-F0-9]{40}$/.test(input)) {
        // mock import: store friendly name only; list will appear after API wiring
        saveWalletName(input, getWalletDisplayName(input));
        setSelectedSafe(input);
      }
      return;
    }
    setSelectedSafe(String(opt.id));
  };

  const handleEnableModule = async () => {
    if (!selectedSafe) return;
    await enableModule(selectedSafe);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg border text-xs sm:text-sm ${activeTab === t.key ? "bg-white/10 border-white/20" : "bg-transparent border-white/10"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-4 sm:p-6 space-y-6">
        {/* Common wallet selector */}
        {isLoading ? (
          <Skeleton height={50} borderRadius={12} />
        ) : (
          <Dropdown
            label="Safe Wallet"
            options={dropdownOptions}
            selectedOption={selectedOption}
            onChange={handleSelect}
            disabled={isCreating || isEnablingModule}
          />
        )}

        {selectedSafe && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="space-y-1">
              <Typography variant="caption" color="secondary" align="left">
                Selected Safe
              </Typography>
              <Typography variant="caption" color="secondary" align="left">
                {selectedSafe}
              </Typography>
              <Typography variant="body" align="left">
                {getWalletDisplayName(selectedSafe)}
              </Typography>
            </div>
            <div className="flex gap-2">
              <input
                className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                placeholder="Edit friendly name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (editingName.trim()) {
                    saveWalletName(selectedSafe, editingName.trim());
                    setEditingName("");
                    refetch();
                  }
                }}
                className="px-3 py-2"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  deleteWalletName(selectedSafe);
                  setEditingName("");
                  refetch();
                }}
                color="purple"
                className="px-3 py-2"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* Tab content */}
        {activeTab === "wallets" && (
          <div className="space-y-4">
            <Typography variant="h3" align="left" color="secondary">
              Your Safe Wallets
            </Typography>
            {error && (
              <Typography variant="caption" color="error" align="left">
                {error}
              </Typography>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeWallets.length === 0 && (
                <Typography variant="caption" color="secondary" align="left">
                  No wallets found. Create or import one.
                </Typography>
              )}
              {safeWallets.map((w) => (
                <div
                  key={w}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2"
                >
                  <Typography variant="span" align="left">
                    {getWalletDisplayName(w)}
                  </Typography>
                  <Typography variant="caption" color="secondary" align="left">
                    <ShortAddress address={w} />
                  </Typography>
                  <div className="flex gap-2">
                    <Button
                      className="px-3 py-2"
                      onClick={() => setSelectedSafe(w)}
                    >
                      Select
                    </Button>
                    <Button
                      className="px-3 py-2"
                      color="purple"
                      onClick={() => saveWalletName(w, getWalletDisplayName(w))}
                    >
                      Edit
                    </Button>
                    <Button
                      className="px-3 py-2"
                      color="red"
                      onClick={() => alert("Delete (mock)")}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "modules" && (
          <div className="space-y-4">
            <Typography variant="h3" align="left" color="secondary">
              TriggerX Module
            </Typography>
            <Typography variant="caption" align="left" color="secondary">
              Enable/verify module on the selected Safe. This uses on-chain
              hooks when available.
            </Typography>
            <div className="flex gap-2">
              <Button
                onClick={handleEnableModule}
                disabled={!selectedSafe || isEnablingModule}
              >
                {isEnablingModule ? "Enabling..." : "Enable Module"}
              </Button>
              <Button color="purple" onClick={() => alert("Verify (mock)")}>
                Verify Status
              </Button>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-4">
            <Typography variant="h3" align="left" color="secondary">
              Jobs
            </Typography>
            <Typography variant="caption" align="left" color="secondary">
              Showing jobs created with the selected Safe (mock data).
            </Typography>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-lg p-3"
                >
                  <Typography variant="span" align="left">
                    Mock Job #{i}
                  </Typography>
                  <Typography variant="caption" color="secondary" align="left">
                    Status: Active
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tokens" && (
          <div className="space-y-4">
            <Typography variant="h3" align="left" color="secondary">
              Tokens
            </Typography>
            <Typography variant="caption" align="left" color="secondary">
              Balances for the selected Safe (mock).
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { symbol: "ETH", balance: "1.23" },
                { symbol: "USDC", balance: "523.11" },
              ].map((t) => (
                <div
                  key={t.symbol}
                  className="bg-white/5 border border-white/10 rounded-lg p-3"
                >
                  <Typography variant="span" align="left">
                    {t.symbol}
                  </Typography>
                  <Typography variant="caption" color="secondary" align="left">
                    {t.balance}
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-4">
            <Typography variant="h3" align="left" color="secondary">
              Job Templates
            </Typography>
            <Typography variant="caption" align="left" color="secondary">
              Quick-start templates using the selected Safe (mock actions).
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Time-based Trigger",
                "Condition-based Trigger",
                "Event-based Trigger",
              ].map((name) => (
                <div
                  key={name}
                  className="bg-white/5 border border-white/10 rounded-lg p-3"
                >
                  <Typography variant="span" align="left">
                    {name}
                  </Typography>
                  <div className="mt-2 flex gap-2">
                    <Button
                      className="px-3 py-2"
                      onClick={() => alert(`Use template: ${name}`)}
                    >
                      Use Template
                    </Button>
                    <Button
                      className="px-3 py-2"
                      color="purple"
                      onClick={() => alert("Preview (mock)")}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Page;
