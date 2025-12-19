"use client";

import dynamic from "next/dynamic";
import React from "react";

const VisualJobBuilderClient = dynamic(
  () => import("@/components/blockly/VisualJobBuilderClient"),
  { ssr: false },
);

export default function VisualJobBuilderEntry() {
  return <VisualJobBuilderClient />;
}
