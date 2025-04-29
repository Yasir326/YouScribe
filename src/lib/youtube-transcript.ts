import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const RE_YOUTUBE =
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

const isServer = typeof window === 'undefined';

const getEnv = (name: string): string => {
  if (!isServer) return '';
  
  try {
    return process?.env?.[name] || '';
  } catch {
    return '';
  }
};

// Check if we're in development mode
const isDevelopment = isServer && getEnv('NODE_ENV') === 'development';

// Simple in-memory cache for transcripts (server-side only)
const transcriptCache: Record<string, {
  timestamp: number;
  data: TranscriptResponse[];
}> = {};

// Cache expiration time: 1 hour
const CACHE_TTL = 3600000;

const SMARTPROXY_USERNAME = getEnv('SMARTPROXY_USERNAME');
const SMARTPROXY_PASSWORD = getEnv('SMARTPROXY_PASSWORD');
const SMARTPROXY_HOST = 'gate.decodo.com';
const SMARTPROXY_PORT = '10010';

const proxyUrl = 
  isServer && SMARTPROXY_USERNAME && SMARTPROXY_PASSWORD
    ? `http://${SMARTPROXY_USERNAME}:${SMARTPROXY_PASSWORD}@${SMARTPROXY_HOST}:${SMARTPROXY_PORT}`
    : null;

if (isServer) {
  console.log(`[YouTube Transcript] Proxy ${proxyUrl ? 'configured' : 'not configured'}, Development mode: ${isDevelopment}`);
}

export class YoutubeTranscriptError extends Error {
  constructor(message: string) {
    super(`[YoutubeTranscript] 🚨 ${message}`);
  }
}

export class YoutubeTranscriptTooManyRequestError extends YoutubeTranscriptError {
  constructor() {
    super(
      'YouTube is receiving too many requests from this IP and now requires solving a captcha to continue'
    );
  }
}

export class YoutubeTranscriptVideoUnavailableError extends YoutubeTranscriptError {
  constructor(videoId: string) {
    super(`The video is no longer available (${videoId})`);
  }
}

export class YoutubeTranscriptDisabledError extends YoutubeTranscriptError {
  constructor(videoId: string) {
    super(`Transcript is disabled on this video (${videoId})`);
  }
}

export class YoutubeTranscriptNotAvailableError extends YoutubeTranscriptError {
  constructor(videoId: string) {
    super(`No transcripts are available for this video (${videoId})`);
  }
}

export class YoutubeTranscriptNotAvailableLanguageError extends YoutubeTranscriptError {
  constructor(lang: string, availableLangs: string[], videoId: string) {
    super(
      `No transcripts are available in ${lang} this video (${videoId}). Available languages: ${availableLangs.join(
        ', '
      )}`
    );
  }
}

export interface TranscriptConfig {
  lang?: string;
  useProxy?: boolean;
  skipCache?: boolean;
  forceNoProxy?: boolean; // New option to force disable proxy
}

export interface TranscriptResponse {
  text: string;
  duration: number;
  offset: number;
  lang?: string;
}

interface LogData {
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
}

/**
 * Class to retrieve transcript if exist
 */
export class YoutubeTranscript {  
  // Set a reasonable global timeout - 5 seconds to stay well under serverless function limits
  private static TIMEOUT = 5000;

  private static log(message: string, data?: LogData) {
    if (isServer) {
      const timestamp = new Date().toISOString();
      const logData = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
      console.log(`[${timestamp}] [YouTube Transcript] ${message}${logData}`);
    }
  }

  /**
   * Fetch transcript from YTB Video with timeout and retry logic
   * @param videoId Video url or video identifier
   * @param config Get transcript in a specific language ISO and proxy config
   */
  public static async fetchTranscript(
    videoId: string,
    config?: TranscriptConfig
  ): Promise<TranscriptResponse[]> {
    const identifier = this.retrieveVideoId(videoId);
    const cacheKey = `${identifier}_${config?.lang || 'default'}`;
    
    this.log('Starting transcript fetch', { videoId: identifier, config });
    
    if (isServer && !config?.skipCache && transcriptCache[cacheKey]) {
      const cached = transcriptCache[cacheKey];
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        this.log('Using cached transcript', { videoId: identifier });
        return cached.data;
      } else {
        this.log('Cache expired', { videoId: identifier });
        delete transcriptCache[cacheKey];
      }
    }
    
    try {
      const result = await this.fetchTranscriptWithTimeout(identifier, config);
      
      if (isServer) {
        this.log('Storing in cache', { videoId: identifier, itemCount: result.length });
        transcriptCache[cacheKey] = {
          timestamp: Date.now(),
          data: result
        };
      }
      
      return result;
    } catch (error) {
      this.log('Error fetching transcript', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        videoId: identifier,
        status: axios.isAxiosError(error) ? error.response?.status : undefined
      });
              
      if (axios.isAxiosError(error) && 
          error.response?.status === 407 && 
          isDevelopment && 
          !config?.forceNoProxy) {
        this.log('Proxy auth failed in dev mode, retrying without proxy', { videoId: identifier });
        return this.fetchTranscriptWithTimeout(identifier, { ...config, forceNoProxy: true });
      }
      
      if (axios.isAxiosError(error) && 
          error.response && 
          error.response.status >= 400 && 
          error.response.status < 500 && 
          error.response.status !== 407) {
        throw error;
      }
      
      throw error;
    }
  }
  
  /**
   * Internal method to fetch transcript with a timeout
   */
  private static async fetchTranscriptWithTimeout(
    videoId: string,
    config?: TranscriptConfig
  ): Promise<TranscriptResponse[]> {
    const useProxy = isServer && 
                     !config?.forceNoProxy && 
                     config?.useProxy !== false && 
                     proxyUrl !== null && 
                     !isDevelopment;
    
    this.log('Starting transcript fetch with timeout', { 
      videoId, 
      useProxy,
      proxyConfigured: !!proxyUrl,
      timeout: this.TIMEOUT 
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('YouTube transcript fetch timed out')), this.TIMEOUT);
    });

    try {
      const proxyAgent = useProxy && SMARTPROXY_USERNAME && SMARTPROXY_PASSWORD
        ? new HttpsProxyAgent(`http://${SMARTPROXY_USERNAME}:${SMARTPROXY_PASSWORD}@${SMARTPROXY_HOST}:${SMARTPROXY_PORT}`)
        : undefined;

      this.log('Fetching video page', { videoId, usingProxy: !!proxyAgent });

      const videoPageResponse = await Promise.race([
        axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
          httpAgent: proxyAgent,
          headers: {
            ...(config?.lang && { 'Accept-Language': config.lang }),
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
          },
        }),
        timeoutPromise
      ]) as { data: string; status: number };
        
      const videoPageBody = videoPageResponse.data;
      
      this.log('Video page fetched', { 
        videoId, 
        status: videoPageResponse.status,
        bodyLength: videoPageBody.length,
        hasCaptions: videoPageBody.includes('"captions":'),
        hasVideoDetails: videoPageBody.includes('"videoDetails":'),
        hasRecaptcha: videoPageBody.includes('class="g-recaptcha"'),
        jsonPreview: videoPageBody.substring(0, 500) + '...'
      });

      const captionsMatch = videoPageBody.match(/"captions":(.*?),"videoDetails"/);
      this.log('Captions match result', { 
        videoId,
        matchFound: !!captionsMatch,
        matchLength: captionsMatch?.length,
        matchContent: captionsMatch ? captionsMatch[1].substring(0, 200) + '...' : null
      });

      if (!captionsMatch || captionsMatch.length < 2) {
        if (videoPageBody.includes('class="g-recaptcha"')) {
          throw new YoutubeTranscriptTooManyRequestError();
        }
        if (!videoPageBody.includes('"playabilityStatus":')) {
          throw new YoutubeTranscriptVideoUnavailableError(videoId);
        }
        throw new YoutubeTranscriptDisabledError(videoId);
      }

      let captions;
      try {
        const captionsJson = captionsMatch[1].replace('\n', '');
        this.log('Parsing captions JSON', {
          videoId,
          jsonLength: captionsJson.length,
          jsonPreview: captionsJson.substring(0, 200) + '...'
        });
        
        captions = JSON.parse(captionsJson)['playerCaptionsTracklistRenderer'];
        
        this.log('Captions parsed', { 
          videoId,
          availableLanguages: captions?.captionTracks?.map((track: { languageCode: string }) => track.languageCode),
          trackCount: captions?.captionTracks?.length
        });
      } catch (e) {
        this.log('Failed to parse captions', { 
          videoId, 
          parseError: e instanceof Error ? e.message : 'Unknown error',
          jsonPreview: captionsMatch[1].substring(0, 200) + '...'
        });
        throw new YoutubeTranscriptDisabledError(videoId);
      }

      if (!captions || !('captionTracks' in captions)) {
        throw new YoutubeTranscriptNotAvailableError(videoId);
      }

      if (
        config?.lang &&
        !captions.captionTracks.some(
          (track: { languageCode: string }) => track.languageCode === config?.lang
        )
      ) {
        throw new YoutubeTranscriptNotAvailableLanguageError(
          config?.lang,
          captions.captionTracks.map((track: { languageCode: string }) => track.languageCode),
          videoId
        );
      }

      const transcriptURL = (
        config?.lang
          ? captions.captionTracks.find(
              (track: { languageCode: string }) => track.languageCode === config?.lang
            )
          : captions.captionTracks[0]
      ).baseUrl;

      this.log('Fetching transcript', { videoId, transcriptURL });

      const transcriptResponse = await Promise.race([
        axios.get(transcriptURL, {
          httpAgent: proxyAgent,
          headers: {
            ...(config?.lang && { 'Accept-Language': config.lang }),
            'User-Agent': USER_AGENT,
          },
        }),
        timeoutPromise
      ]) as { data: string; status: number };
      
      if (transcriptResponse.status !== 200) {
        throw new YoutubeTranscriptNotAvailableError(videoId);
      }
      
      const transcriptBody = transcriptResponse.data;
      const transcriptItems: TranscriptResponse[] = [];
      
      const regex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
      let match;
      while ((match = regex.exec(transcriptBody)) !== null) {
        if (match && match.length >= 4) {
          transcriptItems.push({
            text: match[3],
            duration: parseFloat(match[2]),
            offset: parseFloat(match[1]),
            lang: config?.lang ?? captions.captionTracks[0].languageCode,
          });
        }
      }
      
      this.log('Transcript fetched successfully', { 
        videoId, 
        itemCount: transcriptItems.length,
        firstItem: transcriptItems[0]
      });
      
      return transcriptItems;
    } catch (error) {
      this.log('Error in fetchTranscriptWithTimeout', { 
        videoId,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined
      });

      if (axios.isAxiosError(error) && error.response?.status === 407) {
        this.log('Proxy auth failed, retrying without proxy', { videoId });
        return this.fetchTranscriptWithTimeout(videoId, { ...config, forceNoProxy: true });
      }
      throw error;
    }
  }

  /**
   * Retrieve video id from url or string
   * @param videoId video url or video id
   */
  private static retrieveVideoId(videoId: string) {
    if (videoId.length === 11) {
      return videoId;
    }
    const matchId = videoId.match(RE_YOUTUBE);
    if (matchId && matchId.length) {
      return matchId[1];
    }
    throw new YoutubeTranscriptError(
      'Impossible to retrieve Youtube video ID.'
    );
  }
} 