"use client";
import React from "react";
import { MainContainer } from "../ui/MainContainer";
import { Typography } from "../ui/Typography";
import ApiDocsPage from "./ApiDocsPage";

function Documentation() {
  return (
    <>
      <MainContainer className="p-8 ">
        <Typography variant="h3" color="yellow" align="left">
          API Documentation
        </Typography>
        <Typography variant="body" color="gray" align="left" className="py-4">
          Explore and integrate with our Concentration Power Index (CPI)
          calculation APIs.
        </Typography>

        <ApiDocsPage />
      </MainContainer>
    </>
  );
}

export default Documentation;
