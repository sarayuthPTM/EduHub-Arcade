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
  // If it's an SVG, it's already vector and small, just read as data URL
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        resolve('');
        return;
      }
      compressBase64String(rawDataUrl, options)
        .then(resolve)
        .catch(() => resolve(rawDataUrl)); // Fallback to raw if compression fails
    };
    reader.readAsDataURL(file);
  });
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
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width <= 0 || height <= 0) {
        resolve(dataUrl);
        return;
      }

      // Calculate constrained dimensions while preserving aspect ratio
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

      // Fill white background for JPEGs to prevent black backgrounds on transparent PNGs
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      // Smooth downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL(mimeType, quality);
        // Only use compressed if it's smaller than original
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

    img.src = dataUrl;
  });
}
