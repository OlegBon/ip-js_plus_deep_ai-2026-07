jest.mock('@aws-sdk/client-s3', () => {
  class Command {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  return {
    S3Client: class S3Client {
      config: unknown;

      constructor(config: unknown) {
        this.config = config;
      }

      send = jest.fn();
    },
    DeleteObjectCommand: class DeleteObjectCommand extends Command {},
    GetObjectCommand: class GetObjectCommand extends Command {},
    HeadBucketCommand: class HeadBucketCommand extends Command {},
    PutObjectCommand: class PutObjectCommand extends Command {},
  };
});

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { createS3Client, createStorageService } from '../s3';

describe('S3 storage service', () => {
  const bucket = 'convertly-files';
  const send = jest.fn();
  const storage = createStorageService({ send }, bucket);

  beforeEach(() => {
    send.mockReset();
  });

  it('проверяет доступность бакета', async () => {
    send.mockResolvedValue({});

    await storage.ensureBucket();

    expect(send).toHaveBeenCalledWith(expect.any(HeadBucketCommand));
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: bucket });
  });

  it('загружает файл с метаданными', async () => {
    send.mockResolvedValue({});

    await storage.uploadFile({
      key: 'users/user-1/results/file.pdf',
      body: Buffer.from('file-content'),
      contentType: 'application/pdf',
      contentLength: 12,
    });

    expect(send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect(send.mock.calls[0][0].input).toMatchObject({
      Bucket: bucket,
      Key: 'users/user-1/results/file.pdf',
      ContentType: 'application/pdf',
      ContentLength: 12,
    });
  });

  it('возвращает ответ S3 при скачивании', async () => {
    const body = Buffer.from('file-content');
    send.mockResolvedValue({ Body: body, ContentType: 'application/pdf' });

    const result = await storage.downloadFile('users/user-1/results/file.pdf');

    expect(send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: bucket,
      Key: 'users/user-1/results/file.pdf',
    });
    expect(result.Body).toBe(body);
  });

  it('удаляет объект по ключу', async () => {
    send.mockResolvedValue({});

    await storage.deleteFile('users/user-1/results/file.pdf');

    expect(send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: bucket,
      Key: 'users/user-1/results/file.pdf',
    });
  });

  it('не передаёт в S3 пустые ключи и ключи с абсолютным путём', async () => {
    await expect(storage.uploadFile({ key: '', body: Buffer.from('file') })).rejects.toThrow(
      'Ключ объекта должен быть непустым',
    );
    await expect(storage.deleteFile('/users/user-1/file.pdf')).rejects.toThrow(
      'не должен начинаться',
    );

    expect(send).not.toHaveBeenCalled();
  });
});

describe('S3 client configuration', () => {
  it('использует регион, переданный S3-compatible провайдером', () => {
    const client = createS3Client({
      endpoint: 'https://project.storage.supabase.co/storage/v1/s3',
      region: 'eu-central-1',
      accessKeyId: 'server-only-access-key',
      secretAccessKey: 'server-only-secret',
      bucket: 'convertly-files',
    });

    expect((client as unknown as { config: unknown }).config).toMatchObject({
      endpoint: 'https://project.storage.supabase.co/storage/v1/s3',
      region: 'eu-central-1',
      forcePathStyle: true,
    });
  });
});
