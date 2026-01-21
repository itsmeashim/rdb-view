export interface HTTPXData {
  id?: number;
  port: string;
  url: string;
  input: string;
  location: string;
  title: string;
  scheme: string;
  webserver: string;
  content_type: string;
  method: string;
  host: string;
  path: string;
  time: string;
  a: string[];
  tech: string[];
  words: number;
  lines: number;
  status_code: number;
  content_length: number;
  program: string;
  platform: string;
}

export type ViewMode = 'table' | 'card';
export type GroupBy = 'none' | 'program' | 'platform';
