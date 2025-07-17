"use client";

import React from "react";
import { useAccount } from "wagmi";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";
import { useApiKeys } from "@/hooks/useApiKeys";
import { WalletConnectionCard } from "../common/WalletConnectionCard";
import { Card } from "../ui/Card";

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
            <Typography variant="h2" color="white">
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
                  <DialogTitle>Your New API Key</DialogTitle>
                </DialogHeader>
                <CodeBlockWithCopy code={showFullKey} />
                <DialogDescription className="mt-2 text-xs bg-yellow-100 text-yellow-800 p-2 rounded">
                  <strong>Note:</strong> Copy and save this key now. You will
                  not be able to see it again !
                </DialogDescription>
                <DialogFooter>
                  <Button
                    onClick={() => setShowFullKey(null)}
                    color="purple"
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
                          <Typography variant="h3" color="yellow">
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
                            className="p-1 bg-[#FF5757] rounded-full text-white hover:bg-[#ff4444] transition-colors"
                            title="Delete"
                            onClick={() => handleDeleteClick(idx)}
                            disabled={isDeleting}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.33317 4.99935H11.6665C11.6665 4.55732 11.4909 4.1334 11.1783 3.82084C10.8658 3.50828 10.4419 3.33268 9.99984 3.33268C9.55781 3.33268 9.13389 3.50828 8.82133 3.82084C8.50877 4.1334 8.33317 4.55732 8.33317 4.99935ZM6.6665 4.99935C6.6665 4.11529 7.01769 3.26745 7.64281 2.64233C8.26794 2.01721 9.11578 1.66602 9.99984 1.66602C10.8839 1.66602 11.7317 2.01721 12.3569 2.64233C12.982 3.26745 13.3332 4.11529 13.3332 4.99935H17.4998C17.7208 4.99935 17.9328 5.08715 18.0891 5.24343C18.2454 5.39971 18.3332 5.61167 18.3332 5.83268C18.3332 6.0537 18.2454 6.26566 18.0891 6.42194C17.9328 6.57822 17.7208 6.66602 17.4998 6.66602H16.7648L16.0265 15.2827C15.9555 16.1147 15.5748 16.8898 14.9597 17.4546C14.3446 18.0194 13.5399 18.3328 12.7048 18.3327H7.29484C6.45976 18.3328 5.65507 18.0194 5.03996 17.4546C4.42486 16.8898 4.04415 16.1147 3.97317 15.2827L3.23484 6.66602H2.49984C2.27882 6.66602 2.06686 6.57822 1.91058 6.42194C1.7543 6.26566 1.6665 6.0537 1.6665 5.83268C1.6665 5.61167 1.7543 5.39971 1.91058 5.24343C2.06686 5.08715 2.27882 4.99935 2.49984 4.99935H6.6665ZM12.4998 9.99935C12.4998 9.77833 12.412 9.56637 12.2558 9.41009C12.0995 9.25381 11.8875 9.16602 11.6665 9.16602C11.4455 9.16602 11.2335 9.25381 11.0772 9.41009C10.921 9.56637 10.8332 9.77833 10.8332 9.99935V13.3327C10.8332 13.5537 10.921 13.7657 11.0772 13.9219C11.2335 14.0782 11.4455 14.166 11.6665 14.166C11.8875 14.166 12.0995 14.0782 12.2558 13.9219C12.412 13.7657 12.4998 13.5537 12.4998 13.3327V9.99935ZM8.33317 9.16602C8.11216 9.16602 7.9002 9.25381 7.74392 9.41009C7.58763 9.56637 7.49984 9.77833 7.49984 9.99935V13.3327C7.49984 13.5537 7.58763 13.7657 7.74392 13.9219C7.9002 14.0782 8.11216 14.166 8.33317 14.166C8.55418 14.166 8.76615 14.0782 8.92243 13.9219C9.07871 13.7657 9.1665 13.5537 9.1665 13.3327V9.99935C9.1665 9.77833 9.07871 9.56637 8.92243 9.41009C8.76615 9.25381 8.55418 9.16602 8.33317 9.16602Z"
                                fill="white"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1.5">
                          <Typography variant="body" color="white" align="left">
                            API Key :
                          </Typography>
                          <Typography variant="body" color="gray" align="right">
                            {maskKey(keyObj.key)}
                          </Typography>
                        </div>
                        <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1.5">
                          <Typography variant="body" color="white" align="left">
                            Created At :
                          </Typography>
                          <Typography variant="body" color="gray" align="right">
                            {keyObj.created}
                          </Typography>
                        </div>
                        <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1.5">
                          <Typography variant="body" color="white" align="left">
                            Last Used :
                          </Typography>
                          <Typography variant="body" color="gray" align="right">
                            _
                          </Typography>
                        </div>
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

          {!fetchError &&
            apiKeys[0].key === "No API key generated yet" &&
            !isFetching && <Banner>No API key generated yet</Banner>}

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
