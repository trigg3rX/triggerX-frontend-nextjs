"use client";

import React from "react";
import DevHubPostCard from "./DevHubPostCard";
import DevHubPostCardSkeleton from "./DevHubPostCardSkeleton";
import { DevHubPost } from "@/types/sanity";

interface DevHubPageProps {
  posts: DevHubPost[];
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
}

const DevHubPage: React.FC<DevHubPageProps> = ({
  posts,
  isLoading,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen md:mt-[12rem] mt-[8rem] w-[90%] mx-auto pb-20">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-10 md:mb-12">
          <div className="h-10 w-48 bg-[#222222] rounded-lg animate-pulse"></div>{" "}
          {/* Skeleton for title area */}
          <div className="h-10 w-40 bg-[#222222] rounded-full animate-pulse mt-4 sm:mt-0"></div>{" "}
          {/* Skeleton for button */}
        </div>
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(6)].map((_, index) => (
              <DevHubPostCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen md:mt-[12rem] mt-[8rem] w-[90%] mx-auto flex flex-col items-center justify-center text-white text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Oops! Something went wrong.
        </h2>
        <p className="text-lg mb-2">
          We couldn&apos;t fetch the Dev Hub posts at this time.
        </p>
        <p className="text-sm text-gray-400 mb-6">Error: {error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-[#FBF197] text-black rounded-md hover:bg-opacity-80 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen md:mt-[12rem] mt-[8rem] w-[90%] mx-auto flex flex-col items-center justify-center text-white text-center">
        <h2 className="text-2xl font-semibold mb-4">No Dev Hub Posts Found</h2>
        <p className="text-lg">Check back later for new content!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:mt-[12rem] mt-[8rem] w-[90%] mx-auto pb-20">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-10 md:mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-left text-white mb-4 sm:mb-0 flex items-center gap-3">
          Total
          <span className="text-[#FBF197] text-[25px] font-normal">
            {` { ${posts.length} } `}
          </span>
        </h1>
        {/* <ActionButton
          text="API Services"
          href="/api"
          className="mt-4 sm:mt-0"
        /> */}
      </div>

      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
          {posts.map((post) => (
            <DevHubPostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DevHubPage;
