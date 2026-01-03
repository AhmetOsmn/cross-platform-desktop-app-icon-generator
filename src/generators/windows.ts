import * as path from 'path';
import * as fs from 'fs/promises';
import pngToIco from 'png-to-ico';
import { resizeImageToBuffer, ensureDir } from '../utils/imageProcessor';

// Windows ICO sizes (standard sizes for desktop applications)
const WINDOWS_ICO_SIZES = [16, 24, 32, 48, 256];

export interface WindowsGeneratorResult {
    outputPath: string;
    sizes: number[];
}

/**
 * Generate Windows ICO file from an input image.
 * Creates a multi-resolution ICO file containing all standard Windows icon sizes.
 */
export async function generateWindowsIcons(
    inputPath: string,
    outputDir: string
): Promise<WindowsGeneratorResult> {
    const windowsDir = path.join(outputDir, 'windows');
    await ensureDir(windowsDir);

    // Generate PNG buffers for each size
    const pngBuffers: Buffer[] = [];

    for (const size of WINDOWS_ICO_SIZES) {
        const buffer = await resizeImageToBuffer(inputPath, size);
        pngBuffers.push(buffer);
    }

    // Convert PNGs to ICO
    const icoBuffer = await pngToIco(pngBuffers);

    const outputPath = path.join(windowsDir, 'icon.ico');
    await fs.writeFile(outputPath, icoBuffer);

    return {
        outputPath,
        sizes: WINDOWS_ICO_SIZES
    };
}
