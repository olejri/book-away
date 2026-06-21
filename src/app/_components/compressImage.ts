/**
 * Client-side image compression.
 *
 * Phone screenshots/photos are often several MB, which would blow past the
 * serverless request-body limit once base64-encoded (~+33%). We downscale the
 * image with a <canvas> and re-encode it as JPEG before it ever leaves the
 * browser, keeping the payload small. The image is never persisted — it only
 * lives in memory until the email is sent.
 */

export interface CompressedImage {
  /** Suggested file name, always ends in `.jpg`. */
  filename: string;
  /** MIME type of the encoded output. */
  contentType: "image/jpeg";
  /** Base64-encoded bytes (no `data:` prefix). */
  dataBase64: string;
  /** Decoded byte size, handy for showing the user. */
  sizeBytes: number;
  /** Object URL for previewing — remember to revoke it when done. */
  previewUrl: string;
}

interface Options {
  /** Longest edge in pixels after downscaling. */
  maxDimension?: number;
  /** JPEG quality between 0 and 1. */
  quality?: number;
}

export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.8 }: Options = {},
): Promise<CompressedImage> {
  const bitmap = await loadBitmap(file);

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image. Please try again.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Free the bitmap as soon as we're done drawing.
  if ("close" in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Could not process the image. Please try again.");

  const dataBase64 = await blobToBase64(blob);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "screenshot";

  return {
    filename: `${baseName}.jpg`,
    contentType: "image/jpeg",
    dataBase64,
    sizeBytes: blob.size,
    previewUrl: URL.createObjectURL(blob),
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> path (e.g. some iOS/HEIC edge cases).
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file doesn't look like a supported image."));
    };
    img.src = url;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read the image."));
        return;
      }
      // Strip the `data:image/jpeg;base64,` prefix.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(blob);
  });
}

