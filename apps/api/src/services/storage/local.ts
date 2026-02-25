import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { StorageClient } from "./index.js";

export class LocalStorageClient implements StorageClient {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = resolve(basePath);
  }

  async upload(path: string, data: Buffer | ArrayBuffer | ReadableStream, contentType: string): Promise<void> {
    const fullPath = join(this.basePath, path);
    await mkdir(dirname(fullPath), { recursive: true });

    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (data instanceof ArrayBuffer) {
      buffer = Buffer.from(data);
    } else {
      // ReadableStream
      const chunks: Uint8Array[] = [];
      const reader = (data as ReadableStream).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      buffer = Buffer.concat(chunks);
    }

    await writeFile(fullPath, buffer);
  }

  async download(path: string): Promise<ArrayBuffer> {
    const fullPath = join(this.basePath, path);
    const buffer = await readFile(fullPath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  getPublicUrl(path: string): string {
    return `/api/storage/${path}`;
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = join(this.basePath, path);
    try {
      await access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
