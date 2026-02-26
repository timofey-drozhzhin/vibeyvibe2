import { Jimp } from "jimp";

const TARGET_SIZE = 600;
const JPEG_QUALITY = 85;

/**
 * Process an uploaded image: downscale to 600x600 square JPEG.
 * - If image is larger than 600px on both sides: downscale so shorter side = 600, center crop to 600x600.
 * - If image is smaller: center crop to square at the shorter dimension (no upscaling).
 * Always converts to JPEG.
 */
export async function processImage(data: ArrayBuffer): Promise<ArrayBuffer> {
  const image = await Jimp.read(Buffer.from(data));

  const { width, height } = image;
  const shortSide = Math.min(width, height);

  if (shortSide > TARGET_SIZE) {
    // Downscale + crop to 600x600
    image.cover({ w: TARGET_SIZE, h: TARGET_SIZE });
  } else {
    // No upscaling — just center crop to square at the shorter dimension
    const cropX = Math.floor((width - shortSide) / 2);
    const cropY = Math.floor((height - shortSide) / 2);
    image.crop({ x: cropX, y: cropY, w: shortSide, h: shortSide });
  }

  const buffer = await image.getBuffer("image/jpeg", { quality: JPEG_QUALITY });
  return new Uint8Array(buffer).buffer as ArrayBuffer;
}
