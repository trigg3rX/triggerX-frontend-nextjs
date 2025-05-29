// app/devhub/page.tsx
"use client";

import React from 'react';
import useSanityPosts from '@/hooks/useSanityPosts';         
import DevHubPageLayout from '@/app/components/devhub/DevHubPage';

// The Sanity query remains here or could be imported if used elsewhere
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

const DevHubPage: React.FC = () => {
  const { posts, isLoading, error, refetch } = useSanityPosts(SANITY_POSTS_QUERY);
  return (
    <DevHubPageLayout
      posts={posts}
      isLoading={isLoading}
      error={error}
      onRetry={refetch} // Pass the refetch function to the layout for the "Try Again" button
    />
  );
};

export default DevHubPage;