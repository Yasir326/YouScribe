export const runtime = 'nodejs';

import { TranscriptConfig, TranscriptResponse, TranscriptSnippet } from '../type';
import { Innertube } from 'youtubei.js/web';

import { LogData } from '../type';

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
      `No transcripts are available in ${lang} this video (${videoId}). Available languages: ${availableLangs.join(', ')}`
    );
  }
}

/**
 * Class to retrieve transcript if exist
 */
export class YoutubeTranscript {
  private static youtube: Innertube;

  private static async getYoutube() {
    if (!this.youtube) {
      this.youtube = await Innertube.create({
        lang: 'en',
        location: 'US',
        retrieve_player: false,
      });
    }
    return this.youtube;
  }

  private static log(message: string, data?: LogData) {
    const timestamp = new Date().toISOString();
    const logData = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
    console.log(`[${timestamp}] [YouTube Transcript] ${message}${logData}`);
  }

  public static async fetchTranscript(
    videoId: string,
    config?: TranscriptConfig
  ): Promise<TranscriptResponse[]> {
    try {
      this.log('Fetching transcript', { videoId, config });
      const youtube = await this.getYoutube();
      const info = await youtube.getInfo(videoId);
      const transcriptData = await info.getTranscript();

      if (!transcriptData?.transcript?.content?.body?.initial_segments) {
        this.log('No transcript found', { videoId, config });
        throw new YoutubeTranscriptNotAvailableError(videoId);
      }

      this.log('Transcript found', { videoId, config });

      const segments = transcriptData.transcript.content.body.initial_segments;
      return segments.map(segment => {
        const snippet = segment.snippet as unknown as TranscriptSnippet;
        return {
          text: snippet.text,
          duration: snippet.duration_ms / 1000,
          offset: snippet.start_ms / 1000,
          lang: config?.lang || 'en',
        };
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('captcha')) {
          throw new YoutubeTranscriptTooManyRequestError();
        }
        if (error.message.includes('unavailable')) {
          throw new YoutubeTranscriptVideoUnavailableError(videoId);
        }
        if (error.message.includes('disabled')) {
          throw new YoutubeTranscriptDisabledError(videoId);
        }
      }
      throw error;
    }
  }
}
