import React from 'react';

const DevHubPostCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm bg-[#0F0F0F] p-3 border border-[#5F5F5F] flex flex-col justify-between animate-pulse">
      <div className="w-full h-[200px] rounded-lg bg-[#222222]"></div>
      <div className="flex flex-col ml-3">
        <div className="h-6 w-3/4 bg-[#222222] rounded mt-4 sm:mt-8"></div>
        <div className="h-4 w-32 bg-[#222222] rounded mt-5"></div>
      </div>
    </div>
  );
};

export default DevHubPostCardSkeleton;