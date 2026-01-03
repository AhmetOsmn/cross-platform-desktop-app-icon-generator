import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Resize an image to the specified dimensions while maintaining quality.
 * Images are resized to fill the target dimensions (cover mode) and centered.
 */
export async function resizeImage(
    inputPath: string,
    outputPath: string,
    size: number
): Promise<void> {
    await sharp(inputPath)
        .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
}

/**
 * Resize image and return as buffer (for ICO generation).
 */
export async function resizeImageToBuffer(
    inputPath: string,
    size: number
): Promise<Buffer> {
    return sharp(inputPath)
        .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
}

/**
 * Validate that the input file exists and is a valid image.
 */
export async function validateImage(inputPath: string): Promise<void> {
    try {
        await fs.access(inputPath);
    } catch {
        throw new Error(`Input file not found: ${inputPath}`);
    }

    try {
        const metadata = await sharp(inputPath).metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error('Invalid image: unable to read dimensions');
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('Input file')) {
            throw error;
        }
        throw new Error(`Invalid image file: ${inputPath}`);
    }
}

/**
 * Ensure a directory exists, creating it if necessary.
 */
export async function ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Get image metadata.
 */
export async function getImageMetadata(inputPath: string): Promise<{
    width: number;
    height: number;
    format: string;
}> {
    const metadata = await sharp(inputPath).metadata();
    return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown'
    };
}
