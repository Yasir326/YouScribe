import axios, { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

const RE_YOUTUBE =
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';
const RE_XML_TRANSCRIPT =
  /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;

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
  console.log(`[YouTube Transcript] Proxy ${proxyUrl ? 'configured' : 'not configured'}`);
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
  /**
   * Fetch transcript from YTB Video
   * @param videoId Video url or video identifier
   * @param config Get transcript in a specific language ISO and proxy config
   */
  public static async fetchTranscript(
    videoId: string,
    config?: TranscriptConfig
  ): Promise<TranscriptResponse[]> {
    const identifier = this.retrieveVideoId(videoId);
    
    // IMPORTANT: Browser check - NEVER use proxy in browser context
    // This prevents 407 authentication errors in the browser
    const useProxy = isServer && config?.useProxy !== false && proxyUrl !== null;
    
    // Configure axios request options
    const requestConfig: AxiosRequestConfig = {
      headers: {
        ...(config?.lang && { 'Accept-Language': config.lang }),
        'User-Agent': USER_AGENT,
      },
      timeout: 15000
    };
    
    // Only configure proxy on server-side
    if (useProxy && proxyUrl) {
      try {
        requestConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
        requestConfig.httpAgent = new HttpProxyAgent(proxyUrl);
        
        console.log(`[YouTube Transcript] Fetching video ${identifier} with proxy`);
      } catch (error) {
        console.error('[YouTube Transcript] Error setting up proxy:', error);
      }
    }

    try {
      // Using axios to fetch the video page
      const videoPageResponse = await axios.get(
        `https://www.youtube.com/watch?v=${identifier}`, 
        requestConfig
      );
      
      const videoPageBody = videoPageResponse.data;
      const splittedHTML = videoPageBody.split('"captions":');

      if (splittedHTML.length <= 1) {
        if (videoPageBody.includes('class="g-recaptcha"')) {
          throw new YoutubeTranscriptTooManyRequestError();
        }
        if (!videoPageBody.includes('"playabilityStatus":')) {
          throw new YoutubeTranscriptVideoUnavailableError(videoId);
        }
        throw new YoutubeTranscriptDisabledError(videoId);
      }

      const captions = (() => {
        try {
          return JSON.parse(
            splittedHTML[1].split(',"videoDetails')[0].replace('\n', '')
          );
        } catch (e) {
          console.error('[YouTube Transcript] JSON parse error:', e);
          return undefined;
        }
      })()?.['playerCaptionsTracklistRenderer'];

      if (!captions) {
        throw new YoutubeTranscriptDisabledError(videoId);
      }

      if (!('captionTracks' in captions)) {
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

      // Using axios with the same proxy configuration for transcript request
      const transcriptResponse = await axios.get(transcriptURL, requestConfig);
      
      if (transcriptResponse.status !== 200) {
        throw new YoutubeTranscriptNotAvailableError(videoId);
      }
      
      const transcriptBody = transcriptResponse.data;
      const transcriptItems: TranscriptResponse[] = [];
      
      // Safely process transcript data
      const matches = transcriptBody.matchAll(RE_XML_TRANSCRIPT);
      for (const match of matches) {
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
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        if (isServer) {
          console.error('[YouTube Transcript] Request failed:', {
            message: error.message,
            url: error.config?.url,
            status,
            data: typeof data === 'string' ? data.substring(0, 100) + '...' : data
          });
        }
        
        // Better error messages based on status code
        if (status === 407) {
          throw new YoutubeTranscriptError('Proxy authentication failed. This should only happen on server-side.');
        } else if (status === 403) {
          throw new YoutubeTranscriptError('Access denied by YouTube. Your IP may be blocked.');
        } else if (status === 429) {
          throw new YoutubeTranscriptTooManyRequestError();
        }
        
        throw new YoutubeTranscriptError(`Request failed: ${error.message}`);
      }
      
      // Log and re-throw other errors
      if (isServer) {
        console.error('[YouTube Transcript] Non-Axios error:', error);
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