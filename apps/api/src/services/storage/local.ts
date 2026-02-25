import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { StorageClient } from "./index.js";

export class LocalStorageClient implements StorageClient {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = resolve(basePath);
  }

  /**
   * Resolve a storage path to an absolute filesystem path, ensuring it
   * stays within the configured base directory. Throws if the resolved
   * path escapes the base (e.g. via ".." segments).
   */
  private safePath(path: string): string {
    const fullPath = resolve(join(this.basePath, path));
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error("Path traversal detected: path escapes storage directory");
    }
    return fullPath;
  }

  async upload(path: string, data: Buffer | ArrayBuffer | ReadableStream, contentType: string): Promise<void> {
    const fullPath = this.safePath(path);
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
    const fullPath = this.safePath(path);
    const buffer = await readFile(fullPath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  getPublicUrl(path: string): string {
    return `/api/storage/${path}`;
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = this.safePath(path);
    try {
      await access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
