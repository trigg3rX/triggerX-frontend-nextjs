"use client";
import { useState, useEffect, useCallback } from "react";
import sanityClient from "../lib/sanityClient";
import { DevHubPost } from "../types/sanity";

interface UseSanityPostsReturn {
  posts: DevHubPost[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void; // Allow manual refetching
}

const useSanityPosts = (query: string): UseSanityPostsReturn => {
  const [posts, setPosts] = useState<DevHubPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedPosts: DevHubPost[] = await sanityClient.fetch(query);
      if (!Array.isArray(fetchedPosts)) {
        console.warn("Sanity fetch did not return an array.", fetchedPosts);
        setPosts([]);
      } else {
        setPosts(fetchedPosts);
      }
    } catch (err: unknown) {
      console.error("Error fetching posts from Sanity:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("An unknown error occurred while fetching posts."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [query]); // Query is a dependency for useCallback

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]); // fetchPosts is now stable due to useCallback

  return { posts, isLoading, error, refetch: fetchPosts };
};

export default useSanityPosts;
