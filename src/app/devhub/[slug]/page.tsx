"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { useDevHubPost } from "@/hooks/useDevHubPost";
import { DevHubTableOfContents } from "@/app/components/devhub/DevHubTableOfContents";
import { ActionButton } from "@/app/components/ui/ActionButton";
import { portableTextComponents } from "@/lib/portableTextComponents";
import { urlFor } from "@/lib/sanityImageUrl";
import DevhubItemSkeleton from "./DevhubItemSkeleton";
import { FaGithub } from "react-icons/fa";

export default function DevHubPostPage() {
  const { slug } = useParams();
  const { post, isLoading, error } = useDevHubPost(slug as string);
  const [activeHeading, setActiveHeading] = useState("");

  useEffect(() => {
    if (!post || isLoading || error) return;

    const handleScroll = () => {
      const headings = document.querySelectorAll("h2");
      let currentActive = "";

      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        if (rect.top <= 250) {
          currentActive = headings[i].innerText;
        } else {
          break;
        }
      }
      setActiveHeading(currentActive);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [post, isLoading, error]);

  if (isLoading) return <DevhubItemSkeleton />;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500"><p>Error: {error.message}</p></div>;
  if (!post) return <div className="flex justify-center items-center min-h-screen"><p>Post not found.</p></div>;

  const headerImageUrl = urlFor(post.image)?.width(1200).auto("format").url();

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 min-h-screen md:mt-[17rem] mt-[10rem]">
      <div className="bg-[#131313] rounded-3xl border border-gray-700 p-6 w-[90%] mx-auto">
        <div className="mb-8">
          {headerImageUrl ? (
            <div className="w-[95%] mx-auto rounded-3xl overflow-hidden h-max">
              <img
                src={headerImageUrl}
                alt={post.title || "Header image"}
                className="!relative w-full h-auto"
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-800 h-60 flex items-center justify-center w-full mb-8 text-gray-500">
              No Image Available
            </div>
          )}

          <div className="flex text-md md:text-sm text-white justify-evenly gap-9 my-5 md:flex-row flex-col text-xs">
            <h3 className="text-start flex items-center">
              <span className="w-[110px] flex font-bold">Requires :</span>
              <span className="text-white ml-3 text-left md:text-sm text-xs">
                {post.requires || "N/A"}
              </span>
            </h3>
          </div>

          <div className="flex justify-center">
            <ActionButton
              text="Open Github"
              href={post.githubUrl || '#'}
              icon={<FaGithub />}
              variant="secondary"
              openInNewTab
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-8 w-[87%] mx-auto">
        <DevHubTableOfContents
          headingPairs={post.headingPairs}
          activeHeading={activeHeading}
        />

        <article className="w-full md:w-3/4 mt-10">
          <PortableText
            value={post.body}
            components={portableTextComponents}
          />

          <div className="bg-[#141414] rounded-2xl w-full relative h-[300px] flex flex-col gap-3 items-center justify-center p-[50px] overflow-hidden">
            <p className="relative z-30 max-w-[500px] lg:max-w-[600px] mx-auto text-wrap text-center">
              View the complete code and our ready-to-use template
            </p>
            <ActionButton
              text="Open Github"
              href={post.githubUrl || '#'}
              icon={<FaGithub />}
              variant="secondary"
              openInNewTab
            />
          </div>
        </article>
      </div>

      <div className="my-16 flex justify-center">
        <ActionButton
          text="Go Back to DevHub"
          href="/devhub"
          variant="secondary"
        />
      </div>
    </div>
  );
}
