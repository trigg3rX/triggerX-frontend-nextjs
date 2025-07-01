"use client";
import React from "react";
import { Typography } from "../ui/Typography";
import ApiDocsPage from "./ApiDocsPage";
import { Card } from "../ui/Card";

function Documentation() {
  return (
    <>
      <Card className="p-8 ">
        <Typography variant="h3" color="yellow" align="left">
          API Documentation
        </Typography>
        <Typography variant="body" color="gray" align="left" className="py-4">
          Explore and integrate with our Concentration Power Index (CPI)
          calculation APIs.
        </Typography>

        <ApiDocsPage />
      </Card>
    </>
  );
}

export default Documentation;
