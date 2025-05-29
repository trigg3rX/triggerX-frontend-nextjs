import React from 'react';

const DevhubItemSkeleton = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 min-h-screen md:mt-[17rem] mt-[10rem]">
      <div className="bg-[#131313] rounded-3xl border border-gray-700 p-6 w-[90%] mx-auto">
        <div className="mb-8">
          {/* Image Skeleton */}
          <div className="w-[95%] mx-auto rounded-3xl overflow-hidden h-[300px] bg-gray-800 animate-pulse" />

          {/* Info Skeleton */}
          <div className="flex text-md md:text-sm text-white justify-evenly gap-9 my-5 md:flex-row flex-col text-xs">
            <div className="text-start flex items-center">
              <span className="w-[110px] flex font-bold">Requires :</span>
              <span className="ml-3 text-left md:text-sm text-xs">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
              </span>
            </div>
          </div>

          {/* Button Skeleton */}
          <div className="flex justify-center gap-4">
            <div className="h-10 w-32 bg-gray-700 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-8 w-[87%] mx-auto">
        {/* Table of Contents Skeleton */}
        <aside className="w-full md:w-1/4 min-w-[180px] lg:min-w-[230px] md:sticky top-24 h-full">
          <div className="hidden md:block">
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-full bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </aside>

        {/* Content Skeleton */}
        <article className="w-full md:w-3/4 mt-10">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-full bg-gray-700 rounded animate-pulse" />
            ))}
          </div>

          <div className="bg-[#141414] rounded-2xl w-full relative h-[300px] flex flex-col gap-3 items-center justify-center p-[50px] overflow-hidden mt-8">
            <div className="h-4 w-64 bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-700 rounded-full animate-pulse" />
          </div>
        </article>
      </div>

      {/* Back Button Skeleton */}
      <div className="my-16 flex justify-center">
        <div className="h-10 w-40 bg-gray-700 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default DevhubItemSkeleton; 