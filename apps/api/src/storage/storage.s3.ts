import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "../config/env.js";

import type { StorageService } from "./storage.interface.js";

export class S3Storage implements StorageService {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.AWS_REGION,

      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async put(key: string, content: Buffer, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: content,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error("S3 object has no body");
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
        }),
      );

      return true;
    } catch {
      return false;
    }
  }
}
