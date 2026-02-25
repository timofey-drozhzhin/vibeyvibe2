import type { StorageClient } from "./index.js";

export interface BunnyStorageConfig {
  storageZone: string;
  accessKey: string;
  region: string;
  cdnHostname: string;
}

export class BunnyStorageClient implements StorageClient {
  private readonly storageZone: string;
  private readonly accessKey: string;
  private readonly region: string;
  private readonly cdnHostname: string;

  constructor(config: BunnyStorageConfig) {
    this.storageZone = config.storageZone;
    this.accessKey = config.accessKey;
    this.region = config.region;
    this.cdnHostname = config.cdnHostname;
  }

  private getStorageUrl(path: string): string {
    return `https://${this.region}/${this.storageZone}/${path}`;
  }

  async upload(path: string, data: Buffer | ArrayBuffer | ReadableStream, contentType: string): Promise<void> {
    const url = this.getStorageUrl(path);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        AccessKey: this.accessKey,
        "Content-Type": contentType,
      },
      body: data,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Bunny upload failed (${response.status}): ${text}`);
    }
  }

  async download(path: string): Promise<ArrayBuffer> {
    const url = this.getStorageUrl(path);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        AccessKey: this.accessKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Bunny download failed (${response.status}): ${text}`);
    }

    return response.arrayBuffer();
  }

  getPublicUrl(path: string): string {
    return `https://${this.cdnHostname}/${path}`;
  }

  async exists(path: string): Promise<boolean> {
    const url = this.getStorageUrl(path);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        AccessKey: this.accessKey,
      },
    });

    return response.ok;
  }
}
