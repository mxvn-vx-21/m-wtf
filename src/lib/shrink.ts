const MAX_DIM = { avatar: 512, banner: 1500, image: 1600 } as const;

/** Shrink in the browser (canvas → WebP) so uploads stay small. Falls back to the original file on any problem. */
export async function shrinkImage(file: File, kind: keyof typeof MAX_DIM): Promise<File> {
  try {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM[kind] / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.86));
    if (!blob || (blob.size >= file.size && scale === 1)) return file;
    const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
    return new File([blob], `${kind}.${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}
