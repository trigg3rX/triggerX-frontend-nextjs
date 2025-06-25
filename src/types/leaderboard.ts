// Leaderboard types consolidated from various components

// Base entity for leaderboard participants
export interface BaseEntity {
  id: number;
  name: string;
  address: string;
  points: number;
}

// Keeper tab data
export interface KeeperData extends BaseEntity {
  jobPerformed: number;
  jobAttested: number;
}

// Developer tab data
export interface DeveloperData extends BaseEntity {
  totalJobs: number;
  taskPerformed: number;
}

// Contributor tab data
export interface ContributorData extends BaseEntity {
  contributions: number;
  communityPoints: number;
}

// Tab type
export type TabType = "keeper" | "developer" | "contributor";

// Table data union
export type TableData = KeeperData | DeveloperData | ContributorData;

// Highlighted data types for detail cards
export interface BaseHighlightedData {
  name: string;
  address: string;
  points: number;
}

export interface KeeperHighlightedData extends BaseHighlightedData {
  performed: number;
  attested: number;
}

export interface DeveloperHighlightedData extends BaseHighlightedData {
  totalJobs: number;
  tasksExecuted: number;
}

export interface ContributorHighlightedData extends BaseHighlightedData {
  contributions?: number;
  communityPoints?: number;
}

export type HighlightedDataType =
  | KeeperHighlightedData
  | DeveloperHighlightedData
  | ContributorHighlightedData;
