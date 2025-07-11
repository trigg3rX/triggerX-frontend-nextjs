"use client";

import React from "react";
import { useAccount } from "wagmi";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";
import { useApiKeys } from "@/hooks/useApiKeys";
import { WalletConnectionCard } from "../common/WalletConnectionCard";
import { Card } from "../ui/Card";
import CopyButton from "../ui/CopyButton";
import { FiEdit, FiTrash } from "react-icons/fi";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../leaderboard/Table";
import Banner from "../ui/Banner";

const GenerateApi: React.FC = () => {
  const { isConnected, address } = useAccount();
  const {
    apiKeys,
    generateNewApiKey,
    deleteApiKey,
    isLoading,
    isFetching,
    isDeleting,
    fetchError,
    generateError,
    deleteError,
  } = useApiKeys(address);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [names, setNames] = React.useState<string[]>([]);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    // Initialize names array when apiKeys change
    setNames(apiKeys.map((_, i) => `Key ${i + 1}`));
  }, [apiKeys]);

  const handleNameChange = (idx: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === idx ? value : n)));
  };

  const handleEditClick = (idx: number) => {
    setEditingIndex(idx);
  };

  const handleNameBlur = () => {
    setEditingIndex(null);
  };

  const handleDeleteClick = (idx: number) => {
    setDeleteConfirmIndex(idx);
  };

  const handleDeleteConfirm = async (idx: number) => {
    const keyObj = apiKeys[idx];
    if (keyObj && keyObj.key !== "No API key generated yet") {
      await deleteApiKey(keyObj.key);
      setDeleteConfirmIndex(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmIndex(null);
  };

  const maskKey = (key: string) => {
    if (!key || key === "No API key generated yet") return key;
    return key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : key;
  };

  const handleGenerateApiKey = async () => {
    await generateNewApiKey();
  };

  return (
    <div className="w-full lg:w-[65%]">
      <WalletConnectionCard />
      {isConnected && (
        <Card>
          <div className="flex items-center justify-between mb-6 w-full">
            <Typography variant="h2" color="yellow">
              API Keys
            </Typography>
            <Button onClick={handleGenerateApiKey} disabled={isLoading}>
              {isLoading
                ? "Generating..."
                : generateError
                  ? "Try Again"
                  : "Generate API Key"}
            </Button>
          </div>

          {apiKeys[0].key === "No API key generated yet" && (
            <Banner>No API key generated yet</Banner>
          )}

          {generateError && (
            <Card variant="soft">
              <Typography variant="body" color="error">
                Just missed it! Try generating your API key again.
              </Typography>
            </Card>
          )}

          {deleteError && (
            <Card variant="soft">
              <Typography variant="body" color="error">
                {deleteError}
              </Typography>
            </Card>
          )}
          <div className="overflow-x-auto">
            {isFetching ? (
              <div className="text-center py-8 text-gray-400">
                Loading API keys...
              </div>
            ) : fetchError ? (
              <div className="text-center py-8 text-red-400">{fetchError}</div>
            ) : (
              apiKeys[0]?.key !== "No API key generated yet" && (
                <Table>
                  <TableHeader>
                    <TableRow className="text-nowrap items-center">
                      <TableHead>Name</TableHead>
                      <TableHead>Secret Key</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys[0]?.key === "No API key generated yet" ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-6 text-gray-400"
                        >
                          No API key generated yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiKeys.map((keyObj, idx) => (
                        <TableRow key={idx} className="items-center">
                          <TableCell className="text-nowrap">
                            {editingIndex === idx ? (
                              <input
                                className="bg-transparent border-b border-yellow-400 outline-none text-white w-24"
                                value={names[idx] || `Key ${idx + 1}`}
                                onChange={(e) =>
                                  handleNameChange(idx, e.target.value)
                                }
                                onBlur={handleNameBlur}
                                autoFocus
                              />
                            ) : (
                              <span className="flex items-center gap-2">
                                {names[idx] || `Key ${idx + 1}`}
                                <button
                                  onClick={() => handleEditClick(idx)}
                                  className="ml-1 text-yellow-400 hover:text-yellow-300"
                                >
                                  <FiEdit size={16} />
                                </button>
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="flex items-center gap-2">
                            <span className="font-mono text-sm select-all">
                              {maskKey(keyObj.key)}
                            </span>
                            <CopyButton value={keyObj.key} />
                          </TableCell>
                          <TableCell>{keyObj.created}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>{address || "-"}</TableCell>
                          <TableCell>All</TableCell>
                          <TableCell className="flex gap-2">
                            <button
                              className="text-yellow-400 hover:text-yellow-300"
                              title="Rename"
                              onClick={() => handleEditClick(idx)}
                            >
                              <FiEdit size={16} />
                            </button>
                            {deleteConfirmIndex === idx ? (
                              <div className="flex gap-1">
                                <button
                                  className="text-red-500 hover:text-red-400 text-xs px-2 py-1 border border-red-500 rounded"
                                  title="Confirm Delete"
                                  onClick={() => handleDeleteConfirm(idx)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? "Deleting..." : "Yes"}
                                </button>
                                <button
                                  className="text-gray-400 hover:text-gray-300 text-xs px-2 py-1 border border-gray-500 rounded"
                                  title="Cancel Delete"
                                  onClick={handleDeleteCancel}
                                  disabled={isDeleting}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                className="text-red-500 hover:text-red-400"
                                title="Delete"
                                onClick={() => handleDeleteClick(idx)}
                                disabled={isDeleting}
                              >
                                <FiTrash size={16} />
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GenerateApi;
