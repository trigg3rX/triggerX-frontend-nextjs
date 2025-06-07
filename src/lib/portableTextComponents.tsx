import React from "react";
import { PortableTextComponents, PortableTextBlock } from "@portabletext/react";
import { FaExclamationTriangle } from "react-icons/fa";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { PortableText } from "@portabletext/react";
import Image from "next/image";

// ButtonLink Component
const ButtonLink = ({ value }: { value: { url?: string; text?: string } }) => {
  if (!value?.url || !value?.text) {
    return null;
  }
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

// Disclaimer Component
const Disclaimer = ({
  value,
}: {
  value: { title?: string; text?: string };
}) => {
  if (!value?.text) {
    return null;
  }
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

// CodeBlock Component
const CodeBlock = ({
  value,
}: {
  value: { code?: string; language?: string; filename?: string };
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!value?.code) {
    return null;
  }

  const language = value.language || "text";
  const codeString = String(value.code).trim();
  const filename = value.filename;

  const handleCopy = () => {
    if (!codeString) return;
    navigator.clipboard
      .writeText(codeString)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy code: ", err);
      });
  };

  return (
    <div className="relative group my-6 rounded-lg overflow-hidden bg-[#141414] shadow-md border border-gray-700/50">
      {filename && (
        <div className="bg-[#141414] px-4 py-1.5 text-xs text-gray-300 font-mono border-b border-gray-600/80 flex justify-between items-center">
          <span>{filename}</span>
          <button
            onClick={handleCopy}
            className="p-1 bg-white hover:bg-gray-200 rounded text-[#141414] text-[6px] transition-all duration-150 opacity-70 group-hover:opacity-100"
            aria-label="Copy code to clipboard"
            title={isCopied ? "Copied!" : "Copy code"}
          >
            {isCopied ? (
              <span className="w-3 h-3 text-green-600">✓</span>
            ) : (
              <span className="w-3 h-3">📋</span>
            )}
          </button>
        </div>
      )}

      {!filename && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1 bg-white hover:bg-gray-200 rounded text-[#141414] text-[6px] transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Copy code to clipboard"
          title={isCopied ? "Copied!" : "Copy code"}
        >
          {isCopied ? (
            <span className="w-3 h-3 text-green-600">✓</span>
          ) : (
            <span className="w-3 h-3">📋</span>
          )}
        </button>
      )}

      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          padding: "1.25rem",
          paddingTop: filename ? "0.75rem" : "1.50rem",
          margin: 0,
          borderRadius: filename ? "0" : "0 0 0.5rem 0.5rem",
          fontSize: "0.875rem",
        }}
        wrapLines={true}
        codeTagProps={{
          style: {
            fontFamily: '"Fira Code", "Source Code Pro", monospace',
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          },
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

// StepsAccordion Component
const StepsAccordion = ({
  value,
}: {
  value: {
    heading?: string;
    steps?: Array<{
      _key?: string;
      title?: string;
      content?: PortableTextBlock[];
    }>;
  };
}) => {
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({});

  if (!value?.steps || value.steps.length === 0) {
    return null;
  }

  const toggleStep = (index: number) => {
    setOpenSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="my-10">
      {value.heading && (
        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">
          {value.heading}
        </h2>
      )}
      <div className="space-y-3">
        {value.steps.map((step, index) => (
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
                  <div className="prose prose-invert max-w-none">
                    <PortableText
                      value={step.content}
                      components={portableTextComponents}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => (
      <div className="my-10 w-full h-auto">
        {value?.asset?.url && (
          <Image
            src={value.asset.url}
            alt={value.alt || "Blog Image"}
            width={2500}
            height={2000}
            className="rounded-2xl !relative w-full h-auto"
          />
        )}
      </div>
    ),
    youtube: ({ value }) => (
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
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-700/50 text-red-300 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 my-4 space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 my-4 space-y-1">{children}</ol>
    ),
  },
  listItem: ({ children }) => (
    <li className="text-xs sm:text-sm xl:text-base 2xl:text-lg">{children}</li>
  ),
  block: {
    h2: ({ children }) => {
      const text = Array.isArray(children)
        ? children[0]?.toString()
        : children?.toString();
      return (
        <h2
          id={text}
          className="font-actayWide text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-bold mt-12 mb-5 pt-4 border-t border-gray-700/50"
        >
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const text = Array.isArray(children)
        ? children[0]?.toString()
        : children?.toString();
      return (
        <h3
          id={text}
          className="text-lg sm:text-xl xl:text-2xl 2xl:text-3xl font-semibold mt-8 mb-4"
        >
          {children}
        </h3>
      );
    },
    normal: ({ children }) => (
      <p className="my-4 text-xs sm:text-sm xl:text-base 2xl:text-lg leading-relaxed">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-500 pl-4 italic my-6 text-gray-400">
        {children}
      </blockquote>
    ),
  },
};
