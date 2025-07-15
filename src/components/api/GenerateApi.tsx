"use client";

import React from "react";
import { useAccount } from "wagmi";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";
import { useApiKeys } from "@/hooks/useApiKeys";
import { WalletConnectionCard } from "../common/WalletConnectionCard";
import { Card } from "../ui/Card";
import { FiTrash } from "react-icons/fi";
// Table components removed, now using Card layout
import Banner from "../ui/Banner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../common/Dailog";
import { CodeBlockWithCopy } from "../common/CodeBlockWithCopy";
import Skeleton from "../ui/Skeleton";
import DeleteDialog from "../common/DeleteDialog";
import styles from "@/app/styles/scrollbar.module.css";

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
  const [showFullKey, setShowFullKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Initialize names array when apiKeys change
    setNames(apiKeys.map((_, i) => `Key ${i + 1}`));
  }, [apiKeys]);

  const handleNameChange = (idx: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === idx ? value : n)));
  };

  // const handleEditClick = (idx: number) => {
  //   setEditingIndex(idx);
  // };

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
    const fullKey = await generateNewApiKey();
    if (fullKey) {
      setShowFullKey(fullKey);
    }
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

          {showFullKey && (
            <Dialog
              open={!!showFullKey}
              onOpenChange={(open) => {
                if (!open) setShowFullKey(null);
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    <Typography variant="h2">Your New API Key</Typography>
                  </DialogTitle>
                </DialogHeader>
                <CodeBlockWithCopy code={showFullKey} />
                <DialogDescription>
                  <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 p-2 rounded">
                    <Typography
                      variant="body"
                      color="inherit"
                      align="left"
                      className="!m-0"
                    >
                      <strong>Note:</strong> Copy and save this key now. You
                      will not be able to see it again !
                    </Typography>
                  </div>
                </DialogDescription>
                <DialogFooter>
                  <Button
                    onClick={() => setShowFullKey(null)}
                    color="yellow"
                    className="w-full"
                  >
                    I have saved my key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <div>
            {isFetching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <Skeleton height={140} borderRadius={16} className="w-full" />
                <Skeleton height={140} borderRadius={16} className="w-full" />
              </div>
            ) : fetchError ? (
              <Card variant="soft" className="mb-4">
                <Typography variant="body" color="error">
                  {fetchError}
                </Typography>
              </Card>
            ) : (
              apiKeys[0]?.key !== "No API key generated yet" && (
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] lg:max-h-auto overflow-y-auto ${styles.customScrollbar}`}
                >
                  {apiKeys.map((keyObj, idx) => (
                    <Card key={idx} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        {editingIndex === idx ? (
                          <input
                            className="bg-transparent border-b border-yellow-300 outline-none text-white w-20"
                            value={names[idx] || `Key ${idx + 1}`}
                            onChange={(e) =>
                              handleNameChange(idx, e.target.value)
                            }
                            onBlur={handleNameBlur}
                            autoFocus
                          />
                        ) : (
                          <Typography variant="h3" color="secondary">
                            {names[idx] || `Key ${idx + 1}`}
                          </Typography>
                        )}

                        <div className="flex gap-2">
                          {/* <button
                            className="text-white hover:text-gray-300"
                            title="Rename"
                            onClick={() => handleEditClick(idx)}
                          >
                            <FiEdit size={16} />
                          </button> */}
                          <button
                            className="text-red-500 hover:text-red-400"
                            title="Delete"
                            onClick={() => handleDeleteClick(idx)}
                            disabled={isDeleting}
                          >
                            <FiTrash size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm select-all">
                          {maskKey(keyObj.key)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        <Typography variant="body" align="left">
                          <span className="font-semibold text-white mr-2">
                            Created:
                          </span>{" "}
                          {keyObj.created}
                        </Typography>
                        <Typography variant="body" align="left">
                          <span className="font-semibold text-white">
                            Last Used:
                          </span>{" "}
                          -
                        </Typography>
                      </div>
                    </Card>
                  ))}
                  {/* DeleteDialog for confirming deletion */}
                  <DeleteDialog
                    open={deleteConfirmIndex !== null}
                    onOpenChange={(open) => {
                      if (!open) handleDeleteCancel();
                    }}
                    title="Delete API Key"
                    description="Are you sure you want to delete this API key? This action cannot be undone."
                    onCancel={handleDeleteCancel}
                    onConfirm={() => {
                      if (deleteConfirmIndex !== null)
                        handleDeleteConfirm(deleteConfirmIndex);
                    }}
                    confirmText={isDeleting ? "Deleting..." : "Delete"}
                    cancelText="Cancel"
                  />
                </div>
              )
            )}
          </div>

          {!fetchError && apiKeys[0].key === "No API key generated yet" && (
            <Banner>No API key generated yet</Banner>
          )}

          {generateError && (
            <Card variant="soft" className="mt-4">
              <Typography variant="body" color="error">
                Just missed it! Try generating your API key in a while.
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
        </Card>
      )}
    </div>
  );
};

export default GenerateApi;
