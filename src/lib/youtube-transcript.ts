import axios, { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

const RE_YOUTUBE =
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

// This will track whether we're in server or browser environment
const isServer = typeof window === 'undefined';

// Get environment variables safely (SERVER-SIDE ONLY)
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

// Get proxy credentials (SERVER-SIDE ONLY)
const SMARTPROXY_USERNAME = getEnv('SMARTPROXY_USERNAME');
const SMARTPROXY_PASSWORD = getEnv('SMARTPROXY_PASSWORD');
const SMARTPROXY_HOST = 'gate.decodo.com';
const SMARTPROXY_PORT = '10010';

// Create proxy URL (SERVER-SIDE ONLY)
const proxyUrl = 
  isServer && SMARTPROXY_USERNAME && SMARTPROXY_PASSWORD
    ? `http://${SMARTPROXY_USERNAME}:${SMARTPROXY_PASSWORD}@${SMARTPROXY_HOST}:${SMARTPROXY_PORT}`
    : null;

// Log proxy configuration status (but only on server side)
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
  
  // Allow retries with exponential backoff
  private static MAX_RETRIES = 1;
  
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
    
    // Check cache first (if not explicitly skipped)
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
    
    // Add retry logic
    let lastError: Error = new Error('Unknown error occurred');
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Apply exponential backoff on retries
        if (attempt > 0) {
          const delay = Math.min(Math.pow(2, attempt) * 500, 2000);
          console.log(`[YouTube Transcript] Retry attempt ${attempt}, waiting ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
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
        console.error(`[YouTube Transcript] Attempt ${attempt + 1}/${this.MAX_RETRIES + 1} failed:`, 
          error instanceof Error ? error.message : 'Unknown error');
        
        if (error instanceof Error) {
          lastError = error;
        }
        
        // If it's a proxy authentication error in development mode, 
        // try again without proxy
        if (axios.isAxiosError(error) && 
            error.response?.status === 407 && 
            isDevelopment && 
            !config?.forceNoProxy && 
            attempt === 0) {
          console.log('[YouTube Transcript] Proxy auth failed in dev mode, retrying without proxy');
          try {
            // Force no proxy for the second attempt
            const newConfig = { ...config, forceNoProxy: true };
            const result = await this.fetchTranscriptWithTimeout(identifier, newConfig);
            
            // Store in cache if on server
            if (isServer) {
              transcriptCache[cacheKey] = {
                timestamp: Date.now(),
                data: result
              };
            }
            
            return result;
          } catch (retryError) {
            console.error('[YouTube Transcript] No-proxy retry also failed:', 
              retryError instanceof Error ? retryError.message : 'Unknown error');
            // Continue with normal retry process if this also fails
          }
        }
        
        // Don't retry if it's a client error (4xx) except for 407 proxy errors
        if (axios.isAxiosError(error) && 
            error.response && 
            error.response.status >= 400 && 
            error.response.status < 500 && 
            error.response.status !== 407) {
          throw error;
        }
      }
    }
    
    // All retries failed
    throw lastError;
  }
  
  /**
   * Internal method to fetch transcript with a timeout
   */
  private static async fetchTranscriptWithTimeout(
    videoId: string,
    config?: TranscriptConfig
  ): Promise<TranscriptResponse[]> {
    // IMPORTANT: Browser check - NEVER use proxy in browser context
    // This prevents 407 authentication errors in the browser
    // Also respect forceNoProxy flag for development mode or fallbacks
    const useProxy = isServer && 
                     !config?.forceNoProxy && 
                     config?.useProxy !== false && 
                     proxyUrl !== null && 
                     !isDevelopment; // Don't use proxy in development by default
    
    // Configure axios request options with shorter timeout
    const requestConfig: AxiosRequestConfig = {
      headers: {
        ...(config?.lang && { 'Accept-Language': config.lang }),
        'User-Agent': USER_AGENT,
      },
      // Shorter timeout to prevent function timeouts
      timeout: this.TIMEOUT / 2
    };
    
    // Only configure proxy on server-side and when not forced off
    if (useProxy && proxyUrl) {
      try {
        requestConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
        requestConfig.httpAgent = new HttpProxyAgent(proxyUrl);
        
        if (isServer) {
          console.log(`[YouTube Transcript] Fetching video ${videoId} with proxy`);
        }
      } catch (error) {
        console.error('[YouTube Transcript] Error setting up proxy:', error);
      }
    } else if (isServer) {
      console.log(`[YouTube Transcript] Fetching video ${videoId} without proxy`);
    }

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('YouTube transcript fetch timed out')), this.TIMEOUT);
    });

    // Race the fetch against the timeout
    const videoPageResponse = await Promise.race([
      axios.get(`https://www.youtube.com/watch?v=${videoId}`, requestConfig),
      timeoutPromise
    ]) as { data: string; status: number };
      
    const videoPageBody = videoPageResponse.data;
    
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

    // Parse only the captions section, not the entire response
    let captions;
    try {
      captions = JSON.parse(captionsMatch[1].replace('\n', ''))['playerCaptionsTracklistRenderer'];
    } catch (e) {
      console.error('[YouTube Transcript] JSON parse error:', e);
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

    // Race the transcript fetch against the timeout
    const transcriptResponse = await Promise.race([
      axios.get(transcriptURL, requestConfig),
      timeoutPromise
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