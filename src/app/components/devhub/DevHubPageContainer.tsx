"use client";
import React from "react";
import useSanityPosts from "@/hooks/useSanityPosts";
import DevHubPostCard from "./DevHubPostCard";
import { Button } from "@/app/components/ui/Button";
import Link from "next/link";
import { Card } from "@/app/components/ui/Card";
import { Typography } from "@/app/components/ui/Typography";
import DevHubPostCardSkeleton from "../skeleton/DevHubPostCardSkeleton";
import Banner from "../ui/Banner";

const SANITY_POSTS_QUERY = `*[_type == "post"] | order(_createdAt desc) {
  _id,
  title,
  slug {
    current
  },
  image {
    asset-> {
      _id,
      url
    }
  }
}`;

const DevHubPageContainer: React.FC = () => {
  const { posts, isLoading, error, refetch } =
    useSanityPosts(SANITY_POSTS_QUERY);

  if (isLoading) {
    return <DevHubPostCardSkeleton />;
  }

  if (error) {
    return (
      <Card className="max-w-md w-full flex flex-col items-center text-center gap-4 py-10 mx-auto mt-[100px]">
        <Typography variant="h2" color="primary" className="mb-2">
          Oops! Something went wrong.
        </Typography>
        <Typography variant="body" color="secondary" className="mb-2">
          We couldn&apos;t fetch the Dev Hub posts at this time.
        </Typography>
        {refetch && (
          <Button color="yellow" onClick={refetch}>
            Try Again
          </Button>
        )}
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Banner>No Dev Hub Posts Found. Check back later for new content!</Banner>
    );
  }

  return (
    <div className="min-h-screen md:mt-[12rem] mt-[8rem] w-[90%] mx-auto pb-20">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-10 md:mb-12">
        <Typography
          align="left"
          className="text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-0 flex items-center gap-3"
        >
          Total
          <span className="text-[#F8FF7C]">{` { ${posts.length} } `}</span>
        </Typography>
        <Link href="/api" className="mt-4 sm:mt-0">
          <Button>API Services</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
        {posts.map((post) => (
          <DevHubPostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default DevHubPageContainer;
