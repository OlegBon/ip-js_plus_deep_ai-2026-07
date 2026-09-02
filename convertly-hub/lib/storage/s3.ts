import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';

const DEFAULT_BUCKET = 'convertly-files';

type S3CommandClient = Pick<S3Client, 'send'>;

export type UploadFileInput = {
  key: string;
  body: PutObjectCommandInput['Body'];
  contentType?: string;
  contentLength?: number;
};

type StorageConfig = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Не задана обязательная переменная окружения ${name}.`);
  }

  return value;
}

function validateEndpoint(endpoint: string) {
  let parsedEndpoint: URL;

  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    throw new Error('MINIO_ENDPOINT должен быть корректным HTTP(S)-адресом.');
  }

  if (parsedEndpoint.protocol !== 'http:' && parsedEndpoint.protocol !== 'https:') {
    throw new Error('MINIO_ENDPOINT должен использовать протокол HTTP или HTTPS.');
  }

  return parsedEndpoint.toString().replace(/\/$/, '');
}

function getStorageConfig(): StorageConfig {
  return {
    endpoint: validateEndpoint(requiredEnvironmentVariable('MINIO_ENDPOINT')),
    region: process.env.S3_REGION?.trim() || 'us-east-1',
    accessKeyId: requiredEnvironmentVariable('MINIO_ACCESS_KEY'),
    secretAccessKey: requiredEnvironmentVariable('MINIO_SECRET_KEY'),
    bucket: process.env.MINIO_BUCKET?.trim() || DEFAULT_BUCKET,
  };
}

function assertObjectKey(key: string) {
  if (!key.trim() || key.startsWith('/')) {
    throw new Error("Ключ объекта должен быть непустым и не должен начинаться с '/'.");
  }
}

export function createS3Client(config: StorageConfig = getStorageConfig()) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function createStorageService(client: S3CommandClient, bucket: string) {
  if (!bucket.trim()) {
    throw new Error('Имя S3-бакета не может быть пустым.');
  }

  return {
    async ensureBucket() {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    },

    async uploadFile({ key, body, contentType, contentLength }: UploadFileInput) {
      assertObjectKey(key);

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: contentLength,
        }),
      );
    },

    async downloadFile(key: string): Promise<GetObjectCommandOutput> {
      assertObjectKey(key);

      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

      if (!response.Body) {
        throw new Error('S3 не вернул содержимое запрошенного объекта.');
      }

      return response as GetObjectCommandOutput;
    },

    async deleteFile(key: string) {
      assertObjectKey(key);

      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

export type StorageService = ReturnType<typeof createStorageService>;

let storageService: StorageService | undefined;

export function getStorageService() {
  if (!storageService) {
    const config = getStorageConfig();
    storageService = createStorageService(createS3Client(config), config.bucket);
  }

  return storageService;
}
