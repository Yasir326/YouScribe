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

/**
 * Class to retrieve transcript if exist
 */
export class YoutubeTranscript {  
  // Set a reasonable global timeout - 5 seconds to stay well under serverless function limits
  private static TIMEOUT = 5000;

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
    
    if (isServer && !config?.skipCache && transcriptCache[cacheKey]) {
      const cached = transcriptCache[cacheKey];
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[YouTube Transcript] Using cached transcript for ${identifier}`);
        return cached.data;
      } else {
        // Cache expired
        delete transcriptCache[cacheKey];
      }
    }
    
    try {
      // Try to fetch the transcript with a timeout
      const result = await this.fetchTranscriptWithTimeout(identifier, config);
      
      // Store in cache if on server
      if (isServer) {
        transcriptCache[cacheKey] = {
          timestamp: Date.now(),
          data: result
        };
      }
      
      return result;
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Unknown error');
              
      if (axios.isAxiosError(error) && 
          error.response?.status === 407 && 
          isDevelopment && 
          !config?.forceNoProxy) {
        console.log('[YouTube Transcript] Proxy auth failed in dev mode, retrying without proxy');
        // Retry without proxy
        return this.fetchTranscriptWithTimeout(identifier, { ...config, forceNoProxy: true });
      }
      
      // Don't retry if it's a client error (4xx) except for 407 proxy errors
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
    
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('YouTube transcript fetch timed out')), this.TIMEOUT);
    });

    try {
      // Configure proxy agent only if needed
      const proxyAgent = useProxy && SMARTPROXY_USERNAME && SMARTPROXY_PASSWORD
        ? new HttpsProxyAgent(`http://${SMARTPROXY_USERNAME}:${SMARTPROXY_PASSWORD}@${SMARTPROXY_HOST}:${SMARTPROXY_PORT}`)
        : undefined;

        console.log('=====> block 1')
      // Race the fetch against the timeout
      const videoPageResponse = await Promise.race([
        axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
          httpAgent: proxyAgent,
          headers: {
            ...(config?.lang && { 'Accept-Language': config.lang }),
            'User-Agent': USER_AGENT,
          },
        }),
        timeoutPromise
      ]) as { data: string; status: number };
        
      const videoPageBody = videoPageResponse.data;

      console.log('=====> block 2')
      
      // Extract captions data more efficiently
      const captionsMatch = videoPageBody.match(/"captions":(.*?),"videoDetails/);
      if (!captionsMatch || captionsMatch.length < 2) {
        if (videoPageBody.includes('class="g-recaptcha"')) {
          throw new YoutubeTranscriptTooManyRequestError();
        }
        if (!videoPageBody.includes('"playabilityStatus":')) {
          throw new YoutubeTranscriptVideoUnavailableError(videoId);
        }
        throw new YoutubeTranscriptDisabledError(videoId);
      }

      console.log('=====> block 3')

      // Parse only the captions section, not the entire response
      let captions;
      try {
        captions = JSON.parse(captionsMatch[1].replace('\n', ''))['playerCaptionsTracklistRenderer'];
      } catch (e) {
        console.error('[YouTube Transcript] JSON parse error:', e);
        throw new YoutubeTranscriptDisabledError(videoId);
      }

      console.log('=====> block 4')

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

      // Race the transcript fetch against the timeout
      const transcriptResponse = await Promise.race([
        axios.get(transcriptURL, {
          httpAgent: proxyAgent,
          headers: {
            ...(config?.lang && { 'Accept-Language': config.lang }),
            'User-Agent': USER_AGENT,
          },
        }),
      ]) as { data: string; status: number };
      
      if (transcriptResponse.status !== 200) {
        throw new YoutubeTranscriptNotAvailableError(videoId);
      }
      
      const transcriptBody = transcriptResponse.data;
      const transcriptItems: TranscriptResponse[] = [];
      
      // Safely process transcript data 
      // Use a faster RegExp match approach
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
      
      if (isServer) {
        console.log(`[YouTube Transcript] Successfully fetched ${transcriptItems.length} transcript items`);
      }
      return transcriptItems;
    } catch (error) {
      // If it's a proxy authentication error, try again without proxy
      if (axios.isAxiosError(error) && error.response?.status === 407) {
        console.log('[YouTube Transcript] Proxy auth failed, retrying without proxy');
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