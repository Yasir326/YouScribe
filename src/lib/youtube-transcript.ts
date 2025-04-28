import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';

const RE_YOUTUBE =
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';
const RE_XML_TRANSCRIPT =
  /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;

  // Get environment variables without direct process.env usage, to work in browser environments
const getEnv = (name: string): string => {
  return (typeof window === 'undefined' ? 
    process?.env?.[name] : undefined) || '';
};

// Get proxy credentials
const SMARTPROXY_USERNAME = getEnv('SMARTPROXY_USERNAME') ?? process.env.SMARTPROXY_USERNAME;
const SMARTPROXY_PASSWORD = getEnv('SMARTPROXY_PASSWORD') ?? process.env.SMARTPROXY_PASSWORD;

// Initialize proxy agent using environment variables
// Use HTTP protocol instead of HTTPS for the proxy URL as per SmartProxy requirements
const proxyAgent = SMARTPROXY_USERNAME && SMARTPROXY_PASSWORD
  ? new HttpsProxyAgent(`http://${SMARTPROXY_USERNAME}:${SMARTPROXY_PASSWORD}@gate.decodo.com:10001`)
  : undefined;

// Debug proxy configuration
console.log('Proxy configuration initialized:', SMARTPROXY_USERNAME ? 'Username configured' : 'No username', SMARTPROXY_PASSWORD ? 'Password configured' : 'No password');

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
    
    // Use proxy for YouTube requests if specified or default to true
    const useProxy = config?.useProxy !== false;
    
    // Configure axios request options
    const requestConfig = {
      headers: {
        ...(config?.lang && { 'Accept-Language': config.lang }),
        'User-Agent': USER_AGENT,
      },
      // Add proxy agent if proxy is enabled and agent is available
      ...(useProxy && proxyAgent ? { httpsAgent: proxyAgent } : {}),
      // Increase timeout for proxy requests
      timeout: 10000 
    };

    try {
      // Log request configuration
      console.log('Making YouTube request to:', `https://www.youtube.com/watch?v=${identifier}`);
      
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
          console.error(e);
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

      console.log('Fetching transcript from URL:', transcriptURL.substring(0, 50) + '...');
      
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
      
      console.log(`Successfully fetched ${transcriptItems.length} transcript items`);
      return transcriptItems;
    } catch (error) {
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
        });
        throw new YoutubeTranscriptError(`Error fetching transcript: ${error.message}`);
      }
      // Re-throw other errors
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