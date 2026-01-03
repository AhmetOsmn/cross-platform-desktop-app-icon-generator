import * as path from 'path';
import * as fs from 'fs/promises';
import { resizeImage, ensureDir } from '../utils/imageProcessor';

// Linux PNG sizes (standard sizes for desktop environments)
const LINUX_PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];

export interface LinuxGeneratorResult {
    outputDir: string;
    files: string[];
    sizes: number[];
}

/**
 * Generate Linux PNG icons from an input image.
 * Creates PNG files at multiple resolutions for different Linux desktop environments.
 */
export async function generateLinuxIcons(
    inputPath: string,
    outputDir: string
): Promise<LinuxGeneratorResult> {
    const linuxDir = path.join(outputDir, 'linux');
    await ensureDir(linuxDir);

    const files: string[] = [];

    for (const size of LINUX_PNG_SIZES) {
        const fileName = `${size}x${size}.png`;
        const outputPath = path.join(linuxDir, fileName);

        await resizeImage(inputPath, outputPath, size);
        files.push(fileName);
    }

    return {
        outputDir: linuxDir,
        files,
        sizes: LINUX_PNG_SIZES
    };
}
