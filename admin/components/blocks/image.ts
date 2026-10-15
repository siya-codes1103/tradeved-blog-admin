import { uploadCover } from "@/app/actions";
import { COVER_MAX_WIDTH } from "@/lib/blog/config";

/** Shrinks a photo to web size and WebP in the browser, so uploads stay small and fast. */
export async function compressToWebp(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, COVER_MAX_WIDTH / bmp.width);
  const width = Math.round(bmp.width * scale);
  const height = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  c.getContext("2d")!.drawImage(bmp, 0, 0, width, height);
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not compress image"))), "image/webp", 0.82));
  return { blob, width, height };
}

export async function uploadImage(file: File, name: string): Promise<{ url: string; width: number; height: number }> {
  const { blob, width, height } = await compressToWebp(file);
  const fd = new FormData();
  fd.append("file", blob, "image.webp");
  fd.append("name", name || "image");
  const res = await uploadCover(fd);
  if (!res.ok) throw new Error(res.error);
  return { url: res.url, width, height };
}