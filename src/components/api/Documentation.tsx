"use client";
import React from "react";
import { Typography } from "../ui/Typography";
import ApiDocsPage from "./ApiDocsPage";
import { Card } from "../ui/Card";

function Documentation() {
  return (
    <>
      <Card>
        <Typography variant="h2" color="yellow" align="left">
          API Documentation
        </Typography>
        <Typography
          variant="h4"
          color="secondary"
          align="left"
          className="py-4"
        >
          Explore and integrate your project with TriggerX using API service.
        </Typography>
        <div className="flex flex-col gap-5 pb-3">
          <Typography variant="h4" color="secondary" align="left" className="">
            Accelerate your development with our official SDKs — built for
            seamless integration in your favorite language. Visit the SDK docs
            to explore code samples, setup guides, and download links.
          </Typography>
          <div>
            <a
              href="https://www.npmjs.com/package/sdk-triggerx"
              target="_blank"
              rel="noopener noreferrer"
              className=" hover:bg-[#FFFFFF]  bg-[#F8FF7C] text-black px-4 py-3 rounded-full"
            >
              Check out our SDK
            </a>
          </div>
        </div>
        <ApiDocsPage />
      </Card>
    </>
  );
}

export default Documentation;
