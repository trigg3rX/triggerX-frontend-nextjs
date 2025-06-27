"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowUp } from "react-icons/fa";
import { DevHubPost, SanityImageAsset } from "@/types/sanity";
import { Card } from "@/app/components/ui/Card";
import { Typography } from "@/app/components/ui/Typography";

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
    <Link
      href={`/devhub/${post.slug.current}`}
      className="group"
      role="link"
      tabIndex={0}
    >
      <Card className="overflow-hidden flex flex-col justify-between cursor-pointer gap-3 md:gap-4 lg:gap-6 min-h-[400px] h-full">
        <div className="w-full h-[200px] rounded-lg border border-[#5F5F5F] relative overflow-hidden bg-[#1A1A1A]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.title || "Dev Hub Post Image"}
              fill
              className="transition-transform duration-300 group-hover:scale-[1.01] object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <Typography variant="caption" color="secondary">
                No Image Available
              </Typography>
            </div>
          )}
        </div>

        <Typography variant="h2" align="left">
          {post.title || "Untitled Post"}
        </Typography>

        <div className="flex items-center group-hover:text-[#FBF197] transition-colors duration-200 mt-auto pt-3 pb-1 ">
          <Typography
            variant="body"
            className="mr-2 group-hover:text-[#FBF197] transition-colors duration-200"
          >
            Read User Guide
          </Typography>
          <FaArrowUp className="transform rotate-[45deg] group-hover:translate-x-[2px] transition-transform duration-200" />
        </div>
      </Card>
    </Link>
  );
};

export default DevHubPostCard;
