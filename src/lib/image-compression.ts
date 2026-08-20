/**
 * HandyHub Pro Document & Image Optimization Utility
 * Automatically compresses, resizes, and optimizes images on the client side before upload.
 * Reduces 5MB-10MB mobile camera photos down to 80KB-250KB while keeping text & faces sharp.
 */

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_IMAGE_DIMENSION = 1280; // 1280px max width/height for crisp verification clarity
export const COMPRESSION_QUALITY = 0.82; // 82% quality - imperceptible loss, massive file size savings
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export interface OptimizationResult {
  file: File;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  savedPercentage: number;
  dataUrl?: string;
}

/**
 * Validates and compresses an image or PDF file before network upload.
 * @param file The original user-selected File
 * @returns Promise<OptimizationResult>
 */
export async function optimizeDocumentFile(file: File): Promise<OptimizationResult> {
  const originalSizeBytes = file.size;

  // 1. If it's a PDF document, validate size limit (max 2MB)
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`PDF document is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed limit is 2MB.`);
    }
    return {
      file,
      originalSizeBytes,
      optimizedSizeBytes: file.size,
      savedPercentage: 0,
    };
  }

  // 2. Validate Image MIME Types
  const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|heic)$/i.test(file.name);
  if (!isImage) {
    throw new Error("Unsupported file format. Please upload a JPG, PNG, WEBP, or PDF document.");
  }

  // 3. Perform In-Browser Canvas Compression & Downscaling
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Failed to read selected image file."));
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        // If canvas image decoding fails (e.g. raw HEIC or corrupt image), fallback to original file if <= 2MB
        if (file.size <= MAX_FILE_SIZE_BYTES) {
          resolve({
            file,
            originalSizeBytes,
            optimizedSizeBytes: file.size,
            savedPercentage: 0,
          });
        } else {
          reject(new Error("Unable to process image. Please upload a standard JPG or PNG format under 2MB."));
        }
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if dimensions exceed MAX_IMAGE_DIMENSION
          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
              width = MAX_IMAGE_DIMENSION;
            } else {
              width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
              height = MAX_IMAGE_DIMENSION;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve({
              file,
              originalSizeBytes,
              optimizedSizeBytes: file.size,
              savedPercentage: 0,
            });
            return;
          }

          // Use high quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to Web-optimized JPEG
          const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(outputType, COMPRESSION_QUALITY);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({
                  file,
                  originalSizeBytes,
                  optimizedSizeBytes: file.size,
                  savedPercentage: 0,
                  dataUrl,
                });
                return;
              }

              // Create clean new File object with compressed content
              const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + (outputType === "image/png" ? ".png" : ".jpg");
              const optimizedFile = new File([blob], cleanFileName, {
                type: outputType,
                lastModified: Date.now(),
              });

              const optimizedSizeBytes = optimizedFile.size;
              const savedPercentage = Math.max(
                0,
                Math.round(((originalSizeBytes - optimizedSizeBytes) / originalSizeBytes) * 100)
              );

              resolve({
                file: optimizedFile,
                originalSizeBytes,
                optimizedSizeBytes,
                savedPercentage,
                dataUrl,
              });
            },
            outputType,
            COMPRESSION_QUALITY
          );
        } catch (err) {
          console.warn("[Client Compression Fallback]:", err);
          if (file.size <= MAX_FILE_SIZE_BYTES) {
            resolve({
              file,
              originalSizeBytes,
              optimizedSizeBytes: file.size,
              savedPercentage: 0,
            });
          } else {
            reject(new Error("File size exceeds 2MB limit after processing."));
          }
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
