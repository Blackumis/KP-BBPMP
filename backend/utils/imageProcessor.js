import sharp from "sharp";
import fs from "fs";
import path from "path";

/**
 * Detect if an image is likely a QR code based on its characteristics
 * QR codes typically have:
 * - High contrast (mostly black and white)
 * - Square aspect ratio
 * - Specific pattern characteristics
 */
export const isLikelyQRCode = async (imagePath) => {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Check if image is roughly square (QR codes are square)
    const aspectRatio = metadata.width / metadata.height;
    if (aspectRatio < 0.8 || aspectRatio > 1.2) {
      return false; // Not square enough to be a QR code
    }
    
    // Get image stats to analyze color distribution
    const stats = await image.stats();
    
    // For a QR code, we expect high contrast with mostly black and white
    // Check if the image is predominantly two-toned (high contrast)
    const channels = stats.channels;
    
    // Get the dominant channel (usually grayscale for QR)
    const avgChannel = channels[0]; // Red channel or grayscale
    
    // QR codes typically have a bimodal distribution (black and white)
    // Check if standard deviation is high (indicating high contrast)
    // and mean is around middle (mix of black and white)
    const isHighContrast = avgChannel.stdev > 80;
    
    // Additional check: sample pixels to look for QR pattern
    // QR codes have finder patterns in corners
    const { data, info } = await image
      .resize(100, 100, { fit: 'fill' }) // Normalize size for analysis
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Check corners for finder patterns (black squares with white border)
    // Top-left corner check
    const cornerSize = 7; // Finder pattern is 7x7 modules
    let blackPixelsTopLeft = 0;
    let blackPixelsTopRight = 0;
    let blackPixelsBottomLeft = 0;
    
    for (let y = 0; y < cornerSize; y++) {
      for (let x = 0; x < cornerSize; x++) {
        const idx = y * info.width + x;
        if (data[idx] < 128) blackPixelsTopLeft++;
        
        const idxTR = y * info.width + (info.width - cornerSize + x);
        if (data[idxTR] < 128) blackPixelsTopRight++;
        
        const idxBL = (info.height - cornerSize + y) * info.width + x;
        if (data[idxBL] < 128) blackPixelsBottomLeft++;
      }
    }
    
    const totalCornerPixels = cornerSize * cornerSize;
    // QR finder patterns have specific black-to-white ratio (~50-70% black)
    const hasTopLeftPattern = blackPixelsTopLeft / totalCornerPixels > 0.4 && blackPixelsTopLeft / totalCornerPixels < 0.8;
    const hasTopRightPattern = blackPixelsTopRight / totalCornerPixels > 0.4 && blackPixelsTopRight / totalCornerPixels < 0.8;
    const hasBottomLeftPattern = blackPixelsBottomLeft / totalCornerPixels > 0.4 && blackPixelsBottomLeft / totalCornerPixels < 0.8;
    
    // If at least 2 corners have the pattern, it's likely a QR code
    const cornerPatterns = [hasTopLeftPattern, hasTopRightPattern, hasBottomLeftPattern].filter(Boolean).length;
    
    return isHighContrast && cornerPatterns >= 2;
  } catch (error) {
    console.error("Error detecting QR code:", error);
    return false;
  }
};

/**
 * Remove background from a signature image
 * Works best with signatures on white/light backgrounds
 */
export const removeBackground = async (inputPath, outputPath = null) => {
  try {
    const finalOutputPath = outputPath || inputPath;
    const tempPath = inputPath + ".temp.png";
    
    // Read the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Get raw pixel data
    const { data, info } = await image
      .ensureAlpha() // Ensure we have an alpha channel
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Process pixels - make white/light pixels transparent
    const processedData = Buffer.alloc(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Calculate luminance (brightness)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      
      // Threshold for background detection
      // Higher values = more aggressive background removal
      const threshold = 240; // Pixels with luminance > 240 are considered background
      const softThreshold = 200; // Start fading between 200-240
      
      if (luminance > threshold) {
        // Fully transparent (white background)
        processedData[i] = r;
        processedData[i + 1] = g;
        processedData[i + 2] = b;
        processedData[i + 3] = 0;
      } else if (luminance > softThreshold) {
        // Partial transparency for smoother edges
        const fadeAmount = (luminance - softThreshold) / (threshold - softThreshold);
        processedData[i] = r;
        processedData[i + 1] = g;
        processedData[i + 2] = b;
        processedData[i + 3] = Math.round(a * (1 - fadeAmount));
      } else {
        // Keep the pixel as is (signature ink)
        processedData[i] = r;
        processedData[i + 1] = g;
        processedData[i + 2] = b;
        processedData[i + 3] = a;
      }
    }
    
    // Create new image with processed data
    await sharp(processedData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png() // Always save as PNG to preserve transparency
    .toFile(tempPath);
    
    // Replace original with processed version
    if (fs.existsSync(inputPath) && inputPath !== tempPath) {
      fs.unlinkSync(inputPath);
    }
    
    // Rename temp to final output
    const pngOutputPath = finalOutputPath.replace(/\.(jpg|jpeg)$/i, '.png');
    fs.renameSync(tempPath, pngOutputPath);
    
    return {
      success: true,
      path: pngOutputPath,
      filename: path.basename(pngOutputPath)
    };
  } catch (error) {
    console.error("Error removing background:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Process signature image - detect QR code and remove background if needed
 */
export const processSignatureImage = async (imagePath) => {
  try {
    // First check if it's a QR code
    const isQR = await isLikelyQRCode(imagePath);
    
    if (isQR) {
      console.log("QR code detected, skipping background removal");
      return {
        success: true,
        path: imagePath,
        filename: path.basename(imagePath),
        isQRCode: true,
        backgroundRemoved: false
      };
    }
    
    // Not a QR code, remove background
    console.log("Processing signature image - removing background");
    const result = await removeBackground(imagePath);
    
    if (result.success) {
      return {
        success: true,
        path: result.path,
        filename: result.filename,
        isQRCode: false,
        backgroundRemoved: true
      };
    } else {
      // If background removal fails, return original
      return {
        success: true,
        path: imagePath,
        filename: path.basename(imagePath),
        isQRCode: false,
        backgroundRemoved: false,
        warning: result.error
      };
    }
  } catch (error) {
    console.error("Error processing signature image:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
