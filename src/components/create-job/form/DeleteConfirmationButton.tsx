import React, { useState } from "react";
import DeleteDialog from "../../common/DeleteDialog";

interface DeleteConfirmationButtonProps {
  jobType: number;
  jobId: number;
  handleDeleteLinkedJob: (jobType: number, jobId: number) => void;
}

export const DeleteConfirmationButton: React.FC<
  DeleteConfirmationButtonProps
> = ({ jobType, jobId, handleDeleteLinkedJob }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        className="fill-white hover:scale-110 focus:outline-none w-5 h-5 mb-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          width="100"
          height="100"
          viewBox="0 0 24 24"
          className="w-4 h-4"
        >
          <path d="M 10 2 L 9 3 L 3 3 L 3 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 4.3652344 7 L 6.0683594 22 L 17.931641 22 L 19.634766 7 L 4.3652344 7 z"></path>
        </svg>
      </button>
      <DeleteDialog
        open={showModal}
        onOpenChange={setShowModal}
        title="Delete Job"
        description={`Are you sure you want to delete the Linked Job ${jobId}? This action cannot be undone.`}
        onCancel={() => setShowModal(false)}
        onConfirm={() => {
          handleDeleteLinkedJob(jobType, jobId);
          setShowModal(false);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};
