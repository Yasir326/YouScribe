export type Summary = {
  id: string;
  title: string;
  content: string;
};

export interface TranscriptConfig {
  lang?: string;
}
export interface TranscriptResponse {
  text: string;
  duration: number;
  offset: number;
  lang?: string;
}

export interface LogData {
  videoId: string;
  config?: TranscriptConfig;
  itemCount?: number;
  error?: string;
  status?: number;
  useProxy?: boolean;
  proxyConfigured?: boolean;
  timeout?: number;
  usingProxy?: boolean;
  bodyLength?: number;
  availableLanguages?: string[];
  transcriptURL?: string;
  firstItem?: TranscriptResponse;
  parseError?: unknown;
  captionsMatch?: RegExpMatchArray | null;
  hasCaptions?: boolean;
  hasVideoDetails?: boolean;
  hasRecaptcha?: boolean;
  matchFound?: boolean;
  matchLength?: number;
  matchContent?: string | null;
  jsonLength?: number;
  jsonPreview?: string;
  trackCount?: number;
  hasCaptionsData?: boolean;
  captionsData?: string | null;
  isDevelopment?: boolean;
  requestConfig?: {
    headers?: Record<string, string>;
    httpAgent?: string;
    params?: Record<string, string>;
    validateStatus?: (status: number) => boolean;
  };
  captions?: string;
  text?: string;
  duration?: number;
  offset?: number;
  lang?: string;
  proxyEnabled?: boolean;
}
