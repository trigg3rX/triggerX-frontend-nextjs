import React, { useState } from "react";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { FaExclamationTriangle } from "react-icons/fa";
import { urlFor } from "@/lib/sanityImageUrl";
import {
  PortableTextCodeBlock,
  PortableTextButtonLinkBlock,
  PortableTextDisclaimerBlock,
  PortableTextStepsAccordionBlock,
  PortableTextImageBlock,
  PortableTextYouTubeBlock,
  AccordionStep,
  PortableTextEntry,
  PortableTextMarkDefinition,
} from "@/types/sanity";
import CodeBlockWithCopy from "../common/CodeBlockWithCopy";

function CodeBlock({ value }: { value: PortableTextCodeBlock }) {
  if (!value?.code) return null;
  const codeString = String(value.code).trim();
  return <CodeBlockWithCopy code={codeString} />;
}

const ButtonLink = ({ value }: { value: PortableTextButtonLinkBlock }) => {
  if (!value?.url || !value?.text) return null;
  return (
    <div className="my-8 flex justify-start relative bg-[#222222] text-black border border-black px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-max">
      <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
      <span className="absolute inset-0 bg-white rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
      <a
        href={value.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 text-black font-semibold text-lg"
      >
        {value.text}
      </a>
    </div>
  );
};

const Disclaimer = ({ value }: { value: PortableTextDisclaimerBlock }) => {
  if (!value?.text) return null;
  return (
    <div className="rounded-2xl bg-[#F9FFE1] p-6 my-8 text-black shadow">
      <div className="flex items-center mb-3">
        <FaExclamationTriangle className="text-red-500 mr-3 text-xl flex-shrink-0" />
        <h3 className="font-bold text-lg text-black">
          {value.title || "Disclaimer"}
        </h3>
      </div>
      <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
        {value.text}
      </p>
    </div>
  );
};

const StepsAccordion = ({
  value,
}: {
  value: PortableTextStepsAccordionBlock;
}) => {
  const [openSteps, setOpenSteps] = useState<{ [key: number]: boolean }>({});
  if (!value?.steps || value.steps.length === 0) return null;
  const toggleStep = (index: number) => {
    setOpenSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };
  return (
    <div className="my-10">
      {value.heading && (
        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">
          {value.heading}
        </h2>
      )}
      <div className="space-y-3">
        {value.steps.map((step: AccordionStep, index: number) => (
          <div
            key={step._key || index}
            className="bg-[#242323] rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300"
          >
            <button
              onClick={() => toggleStep(index)}
              className="w-full flex justify-between items-center px-5 py-4 text-left text-white"
              aria-expanded={!!openSteps[index]}
              aria-controls={`step-content-${index}`}
            >
              {" "}
              <span className="font-medium text-base md:text-lg flex items-center">
                <span className="mr-3 text-gray-400">{index + 1}</span>{" "}
                {step.title || `Step ${index + 1}`}
              </span>
              <svg
                className={`w-5 h-5 transform transition-transform duration-300 text-gray-400 ${openSteps[index] ? "rotate-180" : "rotate-0"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
            <div
              id={`step-content-${index}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openSteps[index] ? "max-h-screen" : "max-h-0"}`}
            >
              <div className="px-5 pb-5 pt-2 bg-[#242323]">
                {step.content && (
                  <PortableText
                    value={step.content as PortableTextEntry[]}
                    components={portableTextComponents}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const portableTextComponents = {
  types: {
    image: ({ value }: { value: PortableTextImageBlock }) => {
      let imageUrl = value?.asset?.url;
      if (!imageUrl && value?.asset?._ref) {
        const builder = urlFor(value);
        if (builder) imageUrl = builder.url();
      }
      return (
        <div className="my-10 w-full h-auto">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={value.alt || "Blog Image"}
              width={2500}
              height={2000}
              className="rounded-2xl !relative w-full h-auto"
            />
          ) : null}
        </div>
      );
    },
    youtube: ({ value }: { value: PortableTextYouTubeBlock }) => (
      <div className="my-4 aspect-w-16 aspect-h-9">
        <iframe
          className="w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${value?.url?.split("v=")[1]}`}
          title="YouTube video player"
          style={{ border: "none" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    ),
    buttonLink: ButtonLink,
    disclaimer: Disclaimer,
    stepsAccordion: StepsAccordion,
    codeBlock: CodeBlock,
    code: CodeBlock,
  },
  marks: {
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-bold">{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    code: ({ children }: { children: React.ReactNode }) => (
      <code className="bg-gray-700/50 text-red-300 px-1.5 py-0.5 rounded text-sm ">
        {children}
      </code>
    ),
    link: ({
      value,
      children,
    }: {
      value?: PortableTextMarkDefinition;
      children: React.ReactNode;
    }) => (
      <a
        href={typeof value?.href === "string" ? value.href : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc pl-6 my-4 space-y-1">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal pl-6 my-4 space-y-1">{children}</ol>
    ),
  },
  listItem: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-xs sm:text-sm xl:text-base 2xl:text-lg">{children}</li>
  ),
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => {
      let id: string | undefined = undefined;
      if (Array.isArray(children) && typeof children[0] === "string") {
        id = children[0];
      }
      return (
        <h2
          id={id}
          className="font-actayWide text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-bold mt-12 mb-5 pt-4 border-t border-gray-700/50"
        >
          {children}
        </h2>
      );
    },
    h3: ({ children }: { children?: React.ReactNode }) => {
      let id: string | undefined = undefined;
      if (Array.isArray(children) && typeof children[0] === "string") {
        id = children[0];
      }
      return (
        <h3
          id={id}
          className="text-lg sm:text-xl xl:text-2xl 2xl:text-3xl font-semibold mt-8 mb-4"
        >
          {children}
        </h3>
      );
    },
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="my-4 text-xs sm:text-sm xl:text-base 2xl:text-lg leading-relaxed">
        {children}
      </p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-gray-500 pl-4 italic my-6 text-gray-400">
        {children}
      </blockquote>
    ),
  },
};

export default portableTextComponents;
