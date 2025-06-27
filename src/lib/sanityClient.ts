import { createClient, SanityClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

if (!projectId || !dataset) {
  throw new Error(
    "Sanity projectId or dataset is not defined. Check your environment variables.",
  );
}

const sanityClient: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-02-14",
  useCdn: false,
});

export default sanityClient;

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-02-14",
  useCdn: false,
});
