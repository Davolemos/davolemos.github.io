// Seedance 2.5 text-to-video example using the official Higgsfield SDK (v2 client).
// Server-side only: credentials are read from HF_CREDENTIALS in .env.local at runtime.
import { config as loadEnv } from 'dotenv';
import {
  createHiggsfieldClient,
  AuthenticationError,
  BadInputError,
  ValidationError,
  NotEnoughCreditsError,
  TimeoutError,
  APIError,
} from '@higgsfield/client/v2';

loadEnv({ path: '.env.local', quiet: true });

const MODEL = 'bytedance/seedance-2.5/text-to-video';

async function main(): Promise<number> {
  const credentials = process.env.HF_CREDENTIALS?.trim();
  if (!credentials || !credentials.includes(':')) {
    console.error('HF_CREDENTIALS is missing or not in key-id:key-secret format. Set it in .env.local.');
    return 1;
  }

  const client = createHiggsfieldClient({
    credentials,
    // Video generation can take longer than the SDK's 5-minute polling default.
    maxPollTime: 15 * 60 * 1000,
  });

  console.log(`Submitting ${MODEL} request...`);
  const result = await client.subscribe(MODEL, {
    input: {
      prompt: 'A cinematic scene at sunset',
      duration: 5,
      resolution: '720p',
      aspect_ratio: '16:9',
    },
    withPolling: true,
  });

  // subscribe() polls /requests/{id}/status and returns the final V2Response.
  // 'canceled' is not in the SDK's status type, so compare as a plain string.
  const status: string = result.status;
  console.log(`Request ${result.request_id} finished with status: ${status}`);

  if (status === 'nsfw') {
    console.error('Request was rejected by content moderation (nsfw). No video was generated.');
    return 1;
  }
  if (status === 'failed') {
    console.error('Generation failed. No video was generated.');
    return 1;
  }
  if (status === 'canceled' || status === 'cancelled') {
    console.error('Request was canceled. No video was generated.');
    return 1;
  }

  const videoUrl = result.video?.url;
  if (status !== 'completed' || !videoUrl) {
    console.error('Request did not complete with a video URL.');
    return 1;
  }

  console.log(`Video URL: ${videoUrl}`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    if (error instanceof AuthenticationError) {
      console.error('Authentication failed: check HF_CREDENTIALS.');
    } else if (error instanceof NotEnoughCreditsError) {
      console.error('Not enough credits on the Higgsfield account.');
    } else if (error instanceof BadInputError || error instanceof ValidationError) {
      console.error('Invalid input:', error.message);
    } else if (error instanceof TimeoutError) {
      console.error('Timed out waiting for the request to finish (it may have been canceled):', error.message);
    } else if (error instanceof APIError) {
      console.error(`API error ${error.statusCode}:`, error.message);
    } else {
      console.error('Unexpected error:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  });
