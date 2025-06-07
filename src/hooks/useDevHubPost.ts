import { useState, useEffect } from "react";
import sanityClient from "@/lib/sanityClient";
import { DevHubPost } from "@/types/sanity";

interface UseDevHubPostReturn {
  post: DevHubPost | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const getBlogQuery = (
  slug: string,
) => `*[_type == "post" && slug.current == "${slug}"][0] {
  _id,
  title,
  subtitle,
  image, 
  chainlinkProducts,
  productVersions,
  readTime,
  requires,
  body[]{
    ..., 
    _type == 'image' => {
      ..., 
      asset-> { 
        _id,
        url,
        metadata { 
          dimensions,
          lqip 
        }
      }
    },
    _type == 'stepsAccordion' => {
      _key, 
      _type, 
      heading,
      steps[] {
        _key,
        title,
        content[]{ 
          ...,     
          markDefs[]{
            ...,
            _type == 'link' => { ..., href } 
          },
          children[]{...}
        }
      }
    },
    _type == 'youtube' => { ..., url },
    _type == 'buttonLink' => { ..., url, text },
    _type == 'disclaimer' => { ..., title, text }
  },
  headingPairs[] {
    displayHeading, 
    h2Heading      
  },    
  slug { current }, 
  githubUrl,
  redirect
}`;

export const useDevHubPost = (slug: string): UseDevHubPostReturn => {
  const [post, setPost] = useState<DevHubPost | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPost = async () => {
    if (!slug) {
      setIsLoading(false);
      setError(new Error("No post specified."));
      return;
    }

    setIsLoading(true);
    setPost(null);
    setError(null);

    try {
      const data = await sanityClient.fetch(getBlogQuery(slug));
      if (data) {
        setPost(data);
      } else {
        setError(new Error("Post not found."));
      }
    } catch (err) {
      console.error("Error fetching post from Sanity:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load post data."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  });

  return { post, isLoading, error, refetch: fetchPost };
};
