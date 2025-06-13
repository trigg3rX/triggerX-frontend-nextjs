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

export interface ContractDetail {
  contractAddress: string;
  contractABI: string;
  functions: string[];
  targetFunction: string;
  argumentType: string;
  argsArray: unknown[];
  ipfsCodeUrl: string;
}

export interface ContractDetails {
  [key: string]: ContractDetail;
}

export interface JobContextType {
  selectedJob: Template | null;
  setSelectedJob: (job: Template | null) => void;
  handleJobSelect: (template: Template) => void;
  handleCreateCustomJob: () => void;
}
