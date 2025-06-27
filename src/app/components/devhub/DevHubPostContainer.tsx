"use client";
import { useParams } from "next/navigation";
import { useDevHubPost } from "@/hooks/useDevHubPost";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { urlFor } from "@/lib/sanityImageUrl";
import { PortableText } from "@portabletext/react";
import portableTextComponents from "./portableTextComponents";
import { FaGithub } from "react-icons/fa";
import devhub1 from "@/app/assets/devhub/devhub1.svg";
import devhub2 from "@/app/assets/devhub/devhub2.svg";
import { Button } from "../ui/Button";
import Link from "next/link";

console.log("DevHubPostContainer mounted");

const DevHubPostContainer = () => {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const { post: blog, isLoading, error } = useDevHubPost(slug || "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState("");

  const imageUrl = useMemo(() => {
    if (blog?.image?.asset?._ref) {
      const builder = urlFor(blog.image);
      return builder ? builder.width(1200).auto("format").url() : undefined;
    }
    return undefined;
  }, [blog?.image]);

  useEffect(() => {
    if (!blog || isLoading || error) return;
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
  }, [error, isLoading, blog]);

  if (isLoading) return <div>Loading...</div>;
  if (error || !blog) return <div>Error loading post.</div>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 min-h-screen md:mt-[17rem] mt-[10rem]">
      <div className="bg-[#131313] rounded-3xl border border-gray-700 p-6 w-[90%] mx-auto">
        <div className="mb-4 sm:mb-8">
          {imageUrl ? (
            <div className="w-[95%] mx-auto rounded-3xl overflow-hidden h-max">
              <Image
                src={imageUrl}
                alt={blog.title || "Header image"}
                width={1200}
                height={500}
                className="!relative w-full h-auto"
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-800 h-60 flex items-center justify-center w-full mb-8 text-gray-500">
              No Image Available
            </div>
          )}
          <div className="text-[8px] xs:text-xs sm:text-base flex items-center justify-center mt-3">
            <span className="text-gray-400 mr-2">Requires:</span>
            <span className="text-white">{blog.requires || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-8 w-[87%] mx-auto">
        {/* Table of Content */}
        <aside className="w-full md:w-1/4 min-w-[180px] lg:min-w-[230px] md:sticky top-24 h-full">
          {/* Mobile Dropdown */}
          <div className="md:hidden relative my-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex justify-between items-center px-4 py-2 bg-[#141313] text-white rounded-lg border border-[#5F5F5F] text-xs font-actayWide"
            >
              Table Of Content
              <span
                className={`transform transition ${isOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {isOpen && (
              <ul className="absolute w-full bg-[#141313] text-white rounded-lg border border-[#5F5F5F] mt-2 shadow-lg z-10 text-xs font-actay">
                {blog.headingPairs?.map((pair, index) => (
                  <li key={index} className="py-2 px-2">
                    <a
                      href={`#${pair.h2Heading}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const targetElement = document.getElementById(
                          pair.h2Heading,
                        );
                        if (targetElement) {
                          const yOffset = -160;
                          const y =
                            targetElement.getBoundingClientRect().top +
                            window.scrollY +
                            yOffset;
                          window.scrollTo({ top: y, behavior: "smooth" });
                        }
                      }}
                      className={`text-xs hover:underline ${activeHeading === pair.h2Heading ? "text-green-400 font-bold" : "text-gray-300"}`}
                    >
                      [ {index + 1} ] {pair.displayHeading}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h2 className="hidden md:block font-actayWide text-sm lg:text-lg font-extrabold my-10">
            Table of Content
          </h2>
          <ul className="hidden md:block space-y-2 font-actay">
            {blog.headingPairs?.map((pair, index) => (
              <li key={index}>
                <a
                  href={`#${pair.h2Heading}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const targetElement = document.getElementById(
                      pair.h2Heading,
                    );
                    if (targetElement) {
                      const yOffset = -160;
                      const y =
                        targetElement.getBoundingClientRect().top +
                        window.scrollY +
                        yOffset;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    }
                  }}
                  className={`text-xs lg:text-sm 2xl:text-base hover:underline ${activeHeading === pair.h2Heading ? "text-green-400 font-bold" : "text-gray-300"}`}
                >
                  [ {index + 1} ] {pair.displayHeading}
                </a>
              </li>
            ))}
          </ul>
        </aside>
        {/* Blog Content */}
        <article className="w-full md:w-3/4 md:mt-6">
          <PortableText value={blog.body} components={portableTextComponents} />

          <div className="bg-[#141414] rounded-2xl w-full relative h-[300px] flex flex-col gap-3 items-center justify-center p-[50px] overflow-hidden">
            <div className="z-0 absolute left-0 bottom-0 w-[120px] lg:w-[140px] h-max">
              <Image
                src={devhub1}
                alt="sideimg"
                className="w-full h-auto"
              ></Image>
            </div>
            <div className="z-0 absolute right-0 top-0 w-[140px] lg:w-[160px] h-max">
              <Image
                src={devhub2}
                alt="sideimg"
                className="w-full h-auto"
              ></Image>
            </div>
            <p className="relative z-30 max-w-[500px] lg:max-w-[600px] mx-auto text-wrap text-center text-xs sm:text-sm lg:text-base">
              View the complete code and our ready-to-use template
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              {/* Open Github Button */}

              <a
                href={blog.githubUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-[200px]"
              >
                <Button color="yellow" className="w-full">
                  <FaGithub className="mr-2 inline-block" />
                  <span>Open Github</span>
                </Button>
              </a>
              {/* Try Now Button */}
              <a
                href={blog.redirect || "#"}
                rel="noopener noreferrer"
                className="w-full sm:w-[200px]"
              >
                <Button color="yellow" className="w-full">
                  <span className="text-black">⚡ Try Now</span>
                </Button>
              </a>
            </div>
          </div>

          <Link
            href="/devhub"
            className="w-full flex items-center justify-center mt-6"
          >
            <Button color="white" className="mx-auto">
              Go Back to DevHub
            </Button>
          </Link>
        </article>
      </div>
    </div>
  );
};

export default DevHubPostContainer;
