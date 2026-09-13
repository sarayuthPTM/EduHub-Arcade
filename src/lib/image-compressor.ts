/**
 * Image compressor utility for EduHub Arcade
 * Automatically resizes and compresses high-resolution photos
 * to keep dataUrl sizes under ~100KB so they fit perfectly in localStorage
 * without hitting the 5MB browser quota.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  // If it's an SVG, it's already vector, just read as data URL
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const {
    maxWidth = 1280,
    maxHeight = 720,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve) => {
    // URL.createObjectURL is fast and avoids converting huge files to string first
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      if (width <= 0 || height <= 0) {
        fallbackFileReader(file, resolve);
        return;
      }

      // Constrain dimensions while preserving aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        fallbackFileReader(file, resolve);
        return;
      }

      // White background for JPEG to handle PNG transparency cleanly
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL(mimeType, quality);
        resolve(compressed);
      } catch (err) {
        console.warn('Canvas toDataURL failed, falling back:', err);
        fallbackFileReader(file, resolve);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fallbackFileReader(file, resolve);
    };

    img.src = objectUrl;
  });
}

function fallbackFileReader(file: File, resolve: (res: string) => void) {
  const reader = new FileReader();
  reader.onload = (e) => resolve((e.target?.result as string) || '');
  reader.onerror = () => resolve('');
  reader.readAsDataURL(file);
}

export async function compressBase64String(
  dataUrl: string,
  options: CompressOptions = {}
): Promise<string> {
  // Only compress data URLs
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  // If already SVG, return as is
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return dataUrl;
  }

  const {
    maxWidth = 1280,
    maxHeight = 720,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width <= 0 || height <= 0) {
        resolve(dataUrl);
        return;
      }

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL(mimeType, quality);
        if (compressed.length < dataUrl.length || dataUrl.length > 500 * 1024) {
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      } catch (e) {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    // Notice: NO crossOrigin on data: URLs
    img.src = dataUrl;
  });
}
