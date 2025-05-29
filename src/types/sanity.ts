export interface SanityImageAsset {
  _id: string;
  url: string;
}

export interface SanityImage {
  asset?:
    | {
        _ref: string;
        _type: "reference";
      }
    | SanityImageAsset;
}

export interface SanitySlug {
  current: string;
  _type: "slug";
}

export interface PortableTextMarkDefinition {
  _key: string;
  _type: string;
  [key: string]: unknown; // For other properties like href
}

export interface PortableTextChild {
  _key: string;
  _type: string;
  marks: string[];
  text: string;
}

export interface PortableTextBlock {
  _key: string;
  _type: string;
  children: PortableTextChild[];
  markDefs: PortableTextMarkDefinition[];
  style?: string; // e.g., 'h2', 'normal'
  listItem?: 'bullet' | 'number'; // For list items
  level?: number; // For nested lists
}

export interface PortableTextImageBlock extends PortableTextBlock {
  _type: 'image';
  asset: SanityImageAsset;
  alt?: string;
}

export interface PortableTextCodeBlock extends PortableTextBlock {
  _type: 'codeBlock' | 'code'; // 'code' is often used for inline, 'codeBlock' for multiline
  language?: string;
  code: string;
  filename?: string;
}

export interface PortableTextYouTubeBlock extends PortableTextBlock {
  _type: 'youtube';
  url: string;
}

export interface PortableTextButtonLinkBlock extends PortableTextBlock {
  _type: 'buttonLink';
  url: string;
  text: string;
}

export interface PortableTextDisclaimerBlock extends PortableTextBlock {
  _type: 'disclaimer';
  title?: string;
  text: string;
}

export interface AccordionStep {
  _key: string;
  title: string;
  content: (PortableTextBlock | unknown)[]; // Content can be rich text
}

export interface PortableTextStepsAccordionBlock extends PortableTextBlock {
  _type: 'stepsAccordion';
  heading?: string;
  steps: AccordionStep[];
}

export type PortableTextEntry =
  | PortableTextBlock
  | PortableTextImageBlock
  | PortableTextCodeBlock
  | PortableTextYouTubeBlock
  | PortableTextButtonLinkBlock
  | PortableTextDisclaimerBlock
  | PortableTextStepsAccordionBlock
  | { _type: string; [key: string]: unknown }; // Catch-all for other custom types

export interface HeadingPair {
  displayHeading: string;
  h2Heading: string; // This seems to be used as an ID
}

export interface DevHubPost {
  _id: string;
  title: string;
  slug: SanitySlug;
  image?: {
    asset: SanityImageAsset;
  };
  subtitle?: string;
  chainlinkProducts?: string[];
  productVersions?: string[];
  readTime?: string;
  requires?: string;
  body: PortableTextEntry[];
  headingPairs?: HeadingPair[];
  githubUrl?: string;
  redirect?: string;
}
