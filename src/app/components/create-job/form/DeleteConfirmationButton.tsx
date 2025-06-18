import React, { useRef, useState } from "react";

interface DeleteConfirmationButtonProps {
  jobType: number;
  jobId: number;
  handleDeleteLinkedJob: (jobType: number, jobId: number) => void;
}

export const DeleteConfirmationButton: React.FC<
  DeleteConfirmationButtonProps
> = ({ jobType, jobId, handleDeleteLinkedJob }) => {
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
    setTimeout(() => {
      modalRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDeleteLinkedJob(jobType, jobId);
    closeModal();
  };

  return (
    <>
      <button
        onClick={openModal}
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

      {showModal && (
        <div
          ref={modalRef}
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9999]"
        >
          <div className="relative bg-[#141414] p-6 rounded-2xl border border-white/10 backdrop-blur-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
            <div className="flex flex-col items-center gap-2">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-white sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium" id="modal-title">
                  Delete Job
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete the{" "}
                    <span className="">Linked Job {jobId}</span> ?<br />
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 pt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                className="mt-3 w-full justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black sm:mt-0 sm:w-auto sm:text-sm"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#FF5757] text-base font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black sm:ml-3 sm:w-auto sm:text-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
