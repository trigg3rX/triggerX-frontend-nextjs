"use client";
import React from "react";
import useSanityPosts from "@/hooks/useSanityPosts";
import DevHubPostCard from "./DevHubPostCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
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
  const { posts, isLoading, error } = useSanityPosts(SANITY_POSTS_QUERY);

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
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Banner>No Dev Hub Posts Found. Check back later for new content!</Banner>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Typography variant="h1" color="primary">
        Dev Hub
      </Typography>
      <Typography variant="h4" color="secondary" className="my-6">
        All the docs, tools, and guides you need to build with TriggerX.
      </Typography>
      <div className="w-full flex items-center justify-between mb-10 md:mb-12">
        <Typography align="left" className="flex items-center gap-3 !text-3xl">
          Total
          <span className="text-[#F8FF7C]">{` { ${posts.length} } `}</span>
        </Typography>
        <Link href="/generate-api">
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
