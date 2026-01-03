import * as path from 'path';
import * as fs from 'fs/promises';
import { resizeImage, ensureDir } from '../utils/imageProcessor';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Mac ICNS sizes with their iconutil names
// Format: [size, scale, iconutil-name]
const MAC_ICNS_SIZES: [number, number, string][] = [
    [16, 1, 'icon_16x16.png'],
    [32, 2, 'icon_16x16@2x.png'],
    [32, 1, 'icon_32x32.png'],
    [64, 2, 'icon_32x32@2x.png'],
    [128, 1, 'icon_128x128.png'],
    [256, 2, 'icon_128x128@2x.png'],
    [256, 1, 'icon_256x256.png'],
    [512, 2, 'icon_256x256@2x.png'],
    [512, 1, 'icon_512x512.png'],
    [1024, 2, 'icon_512x512@2x.png']
];

export interface MacGeneratorResult {
    outputPath: string;
    sizes: number[];
    method: 'iconutil' | 'manual';
}

/**
 * Check if iconutil is available (macOS only).
 */
async function isIconutilAvailable(): Promise<boolean> {
    try {
        await execAsync('which iconutil');
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate macOS ICNS file using iconutil (macOS only).
 */
async function generateWithIconutil(
    inputPath: string,
    outputDir: string,
    macDir: string
): Promise<string> {
    const iconsetDir = path.join(macDir, 'icon.iconset');
    await ensureDir(iconsetDir);

    // Generate all required sizes
    for (const [size, , fileName] of MAC_ICNS_SIZES) {
        const outputPath = path.join(iconsetDir, fileName);
        await resizeImage(inputPath, outputPath, size);
    }

    // Use iconutil to create ICNS
    const icnsPath = path.join(macDir, 'icon.icns');
    await execAsync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);

    // Clean up iconset directory
    await fs.rm(iconsetDir, { recursive: true });

    return icnsPath;
}

/**
 * ICNS file format constants.
 */
const ICNS_MAGIC = Buffer.from('icns');

// ICNS type codes for different sizes
const ICNS_TYPES: { [key: number]: string } = {
    16: 'icp4',   // 16x16 PNG
    32: 'icp5',   // 32x32 PNG
    64: 'icp6',   // 64x64 PNG
    128: 'ic07',  // 128x128 PNG
    256: 'ic08',  // 256x256 PNG
    512: 'ic09',  // 512x512 PNG
    1024: 'ic10'  // 1024x1024 PNG
};

/**
 * Generate ICNS file manually (cross-platform fallback).
 * Creates a valid ICNS file without requiring macOS iconutil.
 */
async function generateManually(
    inputPath: string,
    macDir: string
): Promise<string> {
    const sharp = (await import('sharp')).default;

    // Generate PNG buffers for each size
    const iconEntries: { type: string; data: Buffer }[] = [];

    for (const size of [16, 32, 64, 128, 256, 512, 1024]) {
        const type = ICNS_TYPES[size];
        if (!type) continue;

        const pngBuffer = await sharp(inputPath)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();

        iconEntries.push({ type, data: pngBuffer });
    }

    // Calculate total file size
    let totalSize = 8; // ICNS header (magic + size)
    for (const entry of iconEntries) {
        totalSize += 8 + entry.data.length; // Type (4) + size (4) + data
    }

    // Build ICNS file
    const icnsBuffer = Buffer.alloc(totalSize);
    let offset = 0;

    // Write header
    ICNS_MAGIC.copy(icnsBuffer, offset);
    offset += 4;
    icnsBuffer.writeUInt32BE(totalSize, offset);
    offset += 4;

    // Write each icon entry
    for (const entry of iconEntries) {
        // Type code (4 bytes)
        icnsBuffer.write(entry.type, offset, 4, 'ascii');
        offset += 4;

        // Entry size (4 bytes) - includes type and size fields
        icnsBuffer.writeUInt32BE(8 + entry.data.length, offset);
        offset += 4;

        // PNG data
        entry.data.copy(icnsBuffer, offset);
        offset += entry.data.length;
    }

    const icnsPath = path.join(macDir, 'icon.icns');
    await fs.writeFile(icnsPath, icnsBuffer);

    return icnsPath;
}

/**
 * Generate macOS ICNS file from an input image.
 * Uses iconutil on macOS, falls back to manual generation on other platforms.
 */
export async function generateMacIcons(
    inputPath: string,
    outputDir: string
): Promise<MacGeneratorResult> {
    const macDir = path.join(outputDir, 'mac');
    await ensureDir(macDir);

    const sizes = [16, 32, 64, 128, 256, 512, 1024];

    // Try iconutil first (macOS only)
    if (await isIconutilAvailable()) {
        const outputPath = await generateWithIconutil(inputPath, outputDir, macDir);
        return {
            outputPath,
            sizes,
            method: 'iconutil'
        };
    }

    // Fall back to manual generation
    const outputPath = await generateManually(inputPath, macDir);
    return {
        outputPath,
        sizes,
        method: 'manual'
    };
}
