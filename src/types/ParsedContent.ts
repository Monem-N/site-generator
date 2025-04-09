export interface Asset {
  id: string;
  type: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface Section {
  id: string;
  type: string;
  title: string;
  content: string;
  level?: number;
  metadata?: Record<string, unknown>;
}

export interface ParsedContent {
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  sections: Section[];
  content: string;
  assets: Asset[];
}
