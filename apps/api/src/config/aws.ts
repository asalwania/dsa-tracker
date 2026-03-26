import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SESClient } from '@aws-sdk/client-ses';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/** S3 client instance (null if AWS credentials are not configured) */
export let s3Client: S3Client | null = null;

/** SQS client instance (null if AWS credentials are not configured) */
export let sqsClient: SQSClient | null = null;

/** SES client instance (null if AWS credentials are not configured) */
export let sesClient: SESClient | null = null;

if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  const credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  };

  s3Client = new S3Client({ region: env.AWS_REGION, credentials });
  sqsClient = new SQSClient({ region: env.AWS_REGION, credentials });
  sesClient = new SESClient({ region: env.AWS_REGION, credentials });

  logger.info('AWS clients initialized', { region: env.AWS_REGION });
} else {
  logger.warn('AWS credentials not configured — S3, SQS, and SES clients are disabled');
}
