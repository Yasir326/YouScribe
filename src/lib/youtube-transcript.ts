import { TranscriptConfig, TranscriptResponse } from '../type';

import { LogData } from '../type';

const RE_YOUTUBE =
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';
const RE_XML_TRANSCRIPT =
  /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;

const isDevelopment = process.env.NODE_ENV === 'development';

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

/**
 * Class to retrieve transcript if exist
 */
export class YoutubeTranscript {
  /**
   * Fetch transcript from YTB Video
   * @param videoId Video url or video identifier
   * @param config Get transcript in a specific language ISO
   */

  private static log(message: string, data?: LogData) {
      const timestamp = new Date().toISOString();
      const logData = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
      console.log(`[${timestamp}] [YouTube Transcript] ${message}${logData}`);
  }

  public static async fetchTranscript(
    videoId: string,
    config?: TranscriptConfig
  ): Promise<TranscriptResponse[]> {
    this.log('Starting transcript fetch', { videoId });
    const identifier = this.retrieveVideoId(videoId);
    const videoPageResponse = await fetch(
      `https://www.youtube.com/watch?v=${identifier}`,
      {
        headers: {
          ...(config?.lang && { 'Accept-Language': config.lang }),
          'User-Agent': USER_AGENT,
        },
      }
    );
    const videoPageBody = await videoPageResponse.text();
    this.log('Video page fetched', {
          videoId,
          status: videoPageResponse.status,
          bodyLength: JSON.stringify(videoPageBody).length,
          hasCaptions: JSON.stringify(videoPageBody).includes('"captions":'),
          hasVideoDetails: JSON.stringify(videoPageBody).includes('"videoDetails":'),
          hasRecaptcha: JSON.stringify(videoPageBody).includes('class="g-recaptcha"'),
          jsonPreview: JSON.stringify(videoPageBody).substring(0, 500) + '...'
        });

    const splittedHTML = videoPageBody.split('"captions":');

    if (splittedHTML.length <= 1) {
      if (videoPageBody.includes('class="g-recaptcha"')) {
        this.log('Captcha found', { videoId });
        throw new YoutubeTranscriptTooManyRequestError();
      }
      if (!videoPageBody.includes('"playabilityStatus":')) {
        this.log('Video unavailable', { videoId });
        throw new YoutubeTranscriptVideoUnavailableError(videoId);
      }
      this.log('Transcript disabled', { videoId });
      throw new YoutubeTranscriptDisabledError(videoId);
    }


    const captions = (() => {
      try {
        this.log('Parsing captions', { videoId });
        return JSON.parse(
          splittedHTML[1].split(',"videoDetails')[0].replace('\n', '')
        );
      } catch (e) {
        this.log('Error parsing captions', { videoId, error: e instanceof Error ? e.message : 'Unknown error' });
        return undefined;
      }
    })()?.['playerCaptionsTracklistRenderer'];

    if (!captions) {
      this.log('No captions found', { videoId });
      throw new YoutubeTranscriptDisabledError(videoId);
    }

    if (!('captionTracks' in captions)) {
      this.log('No caption tracks found', { videoId });
      throw new YoutubeTranscriptNotAvailableError(videoId);
    }

    if (
      config?.lang &&
      !captions.captionTracks.some(
        (track: { languageCode: string }) => track.languageCode === config?.lang
      )
    ) {
      this.log('No caption tracks found', { videoId });
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
    this.log('Transcript URL', { videoId, transcriptURL });

    const transcriptResponse = await fetch(transcriptURL, {
      headers: {
        ...(config?.lang && { 'Accept-Language': config.lang }),
        'User-Agent': USER_AGENT,
      },
    });
    if (!transcriptResponse.ok) {
      this.log('Transcript not available', { videoId });
      throw new YoutubeTranscriptNotAvailableError(videoId);
    }
    const transcriptBody = await transcriptResponse.text();
    const results = Array.from(transcriptBody.matchAll(RE_XML_TRANSCRIPT));
    this.log('Transcript fetched successfully', {
          videoId,
          itemCount: results.length,
          text: results[0][3],
          duration: parseFloat(results[0][2]),
          offset: parseFloat(results[0][1]),
          lang: config?.lang ?? captions.captionTracks[0].languageCode,
        });
    return results.map((result) => ({
      text: result[3],
      duration: parseFloat(result[2]),
      offset: parseFloat(result[1]),
      lang: config?.lang ?? captions.captionTracks[0].languageCode,
    }));
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
    this.log('Impossible to retrieve Youtube video ID', { videoId });
    throw new YoutubeTranscriptError(
      'Impossible to retrieve Youtube video ID.'
    );
  }
}