import React, { Suspense } from "react";
import { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/lib/sanityImageUrl";
import DevHubPostContainer from "@/components/devhub/DevHubPostContainer";
import DevHubPostContainerSkeleton from "@/components/skeleton/DevHubPostContainerSkeleton";

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0] {
        title,
        image,
        body[0...2]
      }`,
      { slug },
    );

    if (!post) {
      return {
        title: "Post Not Found | TriggerX DevHub",
        description: "The requested post could not be found.",
      };
    }

    // Generate description from body content
    let description = "TriggerX - Web3 Automation Platform.";
    if (post.body && post.body.length > 0) {
      const firstBlock = post.body[0];
      if (firstBlock.children && firstBlock.children.length > 0) {
        const textContent = firstBlock.children
          .map((child: { text?: string }) => child.text || "")
          .join(" ")
          .slice(0, 160);
        description = textContent + (textContent.length >= 160 ? "..." : "");
      }
    }

    // Generate image URL for Open Graph
    let imageUrl = undefined;
    if (post.image?.asset?._ref) {
      const builder = urlFor(post.image);
      imageUrl = builder
        ? builder.width(1200).height(630).auto("format").url()
        : undefined;
    }

    return {
      title: `${post.title} | TriggerX DevHub`,
      description,
      openGraph: {
        title: post.title,
        description,
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ]
          : [],
        type: "article",
        siteName: "Devhub| TriggerX",
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Generate API  | TriggerX",
      description: "TriggerX - Web3 Automation Platform.",
    };
  }
}

const DevHubPostPage = () => {
  return (
    <Suspense fallback={<DevHubPostContainerSkeleton />}>
      <DevHubPostContainer />
    </Suspense>
  );
};

export default DevHubPostPage;
