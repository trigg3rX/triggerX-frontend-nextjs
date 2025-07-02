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
          Explore and integrate with our Concentration Power Index (CPI)
          calculation APIs.
        </Typography>

        <ApiDocsPage />
      </Card>
    </>
  );
}

export default Documentation;
