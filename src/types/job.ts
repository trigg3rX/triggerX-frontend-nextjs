import { StaticImageData } from "next/image";

export interface Template {
  id: string;
  title: string;
}

export interface TriggerOption {
  value: number;
  label: string;
  icon: StaticImageData;
  selectedIcon: StaticImageData;
}

export interface Timeframe {
  days: number;
  hours: number;
  minutes: number;
}

export interface TimeInterval {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface JobContextType {
  selectedJob: Template | null;
  setSelectedJob: (job: Template | null) => void;
  handleJobSelect: (template: Template) => void;
  handleCreateCustomJob: () => void;
}

export interface ContractEvent {
  name: string;
  inputs: { name?: string; type: string }[];
}

export interface ContractFunction {
  name: string;
  inputs: { type: string }[];
  outputs: { type: string }[];
  stateMutability: string;
  payable: boolean;
  constant: boolean;
}

export interface ApiKey {
  name: string;
  value: string;
  originalValue?: string;
  description?: string;
}

export interface ContractDetails {
  address: string;
  abi: string | null;
  isCheckingABI: boolean;
  manualABI: string;
  events: ContractEvent[];
  targetEvent: string;
  selectedEventArgument?: string;
  eventArgumentValue?: string;
  functions: ContractFunction[];
  targetFunction: string;
  argumentType?: "static" | "dynamic" | "";
  argumentValues?: string[];
  ipfsCodeUrl?: string;
  ipfsCodeUrlError?: string;
  sourceType?: string;
  sourceUrl?: string;
  sourceUrlError?: string;
  conditionType?: string;
  upperLimit?: string;
  lowerLimit?: string;
  apiKeys?: ApiKey[];
  selectedApiKey?: string;
  selectedApiKeyValue?: string;
  isFetchingApiKeys?: boolean;
  apiKeysError?: string;
}

export interface ContractInteraction {
  [key: string]: ContractDetails;
}

export type FunctionInput = { name?: string; type: string };
