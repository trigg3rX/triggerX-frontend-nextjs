"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowUp } from 'react-icons/fa';
import { DevHubPost, SanityImageAsset } from '@/types/sanity'; // Adjust path as needed

interface DevHubPostCardProps {
  post: DevHubPost;
}

const DevHubPostCard: React.FC<DevHubPostCardProps> = ({ post }) => {
  if (!post.slug?.current) {
    console.warn("Post card rendered without a valid slug:", post.title);
    return null; 
  }

  const imageUrl = (post.image?.asset as SanityImageAsset)?.url;

  return (
    <Link href={`/devhub/${post.slug.current}`} passHref legacyBehavior>
      <a
        role="link" 
        tabIndex={0} 
        className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-[#0F0F0F] p-3 border border-[#5F5F5F] flex flex-col justify-between cursor-pointer group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F0F0F] focus:ring-[#FBF197]"
      >
        <div className="w-full h-[200px] rounded-lg border border-[#5F5F5F] relative overflow-hidden bg-[#1A1A1A]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.title || 'Dev Hub Post Image'}
              layout="fill" 
              objectFit="cover" 
              className="transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <span>No Image Available</span>
            </div>
          )}
        </div>

        <div className="flex flex-col ml-1 md:ml-3 mt-3 md:mt-4">
          <h2 className="font-actayWide text-base sm:text-lg lg:text-xl text-white group-hover:text-[#FBF197] transition-colors duration-200 line-clamp-2">
            {post.title || 'Untitled Post'}
          </h2>

          <div className="flex items-center text-[#B7B7B7] group-hover:text-white mt-auto pt-3 pb-1 rounded-lg w-max text-xs sm:text-sm transition-colors duration-200">
            Read User Guide
            <FaArrowUp className="ml-2 transform rotate-[45deg] group-hover:translate-x-[2px] transition-transform duration-200" />
          </div>
        </div>
      </a>
    </Link>
  );
};

export default DevHubPostCard;