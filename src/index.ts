#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs/promises';
import { validateImage, getImageMetadata, ensureDir } from './utils/imageProcessor';
import { generateWindowsIcons } from './generators/windows';
import { generateMacIcons } from './generators/mac';
import { generateLinuxIcons } from './generators/linux';

const program = new Command();

type Platform = 'windows' | 'mac' | 'linux';
const ALL_PLATFORMS: Platform[] = ['windows', 'mac', 'linux'];

interface GenerationOptions {
    output?: string;
    platforms?: string;
    force?: boolean;
}

/**
 * Normalize a filename for use in output directory name.
 * Removes special characters, replaces spaces with dashes, and lowercases.
 */
function normalizeFileName(fileName: string): string {
    return fileName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with dashes
        .replace(/^-+|-+$/g, '')         // Trim leading/trailing dashes
        .replace(/-+/g, '-');            // Collapse multiple dashes
}

/**
 * Check if a directory exists.
 */
async function directoryExists(dirPath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(dirPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Get a unique output directory path by appending a number if necessary.
 */
async function getUniqueOutputDir(baseDir: string): Promise<string> {
    if (!await directoryExists(baseDir)) {
        return baseDir;
    }

    let counter = 2;
    let candidateDir = `${baseDir}-${counter}`;

    while (await directoryExists(candidateDir)) {
        counter++;
        candidateDir = `${baseDir}-${counter}`;
    }

    return candidateDir;
}

/**
 * Parse platform string into array of platforms.
 */
function parsePlatforms(platformString?: string): Platform[] {
    if (!platformString) {
        return ALL_PLATFORMS;
    }

    const requested = platformString.split(',').map(p => p.trim().toLowerCase());
    const valid: Platform[] = [];

    for (const p of requested) {
        if (ALL_PLATFORMS.includes(p as Platform)) {
            valid.push(p as Platform);
        } else {
            console.warn(`Warning: Unknown platform "${p}" ignored`);
        }
    }

    return valid.length > 0 ? valid : ALL_PLATFORMS;
}

/**
 * Main generation function.
 */
async function generateIcons(inputPath: string, options: GenerationOptions): Promise<void> {
    // Resolve absolute path
    const absoluteInputPath = path.resolve(inputPath);

    console.log('\n🎨 Cross-Platform Icon Generator\n');
    console.log(`📁 Input: ${absoluteInputPath}`);

    // Validate input image
    try {
        await validateImage(absoluteInputPath);
    } catch (error) {
        console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }

    // Get image metadata
    const metadata = await getImageMetadata(absoluteInputPath);
    console.log(`📐 Dimensions: ${metadata.width}x${metadata.height} (${metadata.format})`);

    // Determine output directory
    const inputDir = path.dirname(absoluteInputPath);
    const inputFileName = path.basename(absoluteInputPath, path.extname(absoluteInputPath));
    const normalizedName = normalizeFileName(inputFileName);
    let baseOutputDir = options.output
        ? path.resolve(options.output)
        : path.join(inputDir, `${normalizedName}-icons`);

    let outputDir: string;

    if (options.force) {
        // Force mode: delete existing directory if it exists
        outputDir = baseOutputDir;
        if (await directoryExists(outputDir)) {
            await fs.rm(outputDir, { recursive: true });
            console.log(`🗑️  Removed existing directory: ${outputDir}`);
        }
    } else {
        // Non-force mode: find unique directory name
        outputDir = await getUniqueOutputDir(baseOutputDir);
    }

    console.log(`📂 Output: ${outputDir}`);

    // Ensure output directory exists
    await ensureDir(outputDir);

    // Parse platforms
    const platforms = parsePlatforms(options.platforms);
    console.log(`🖥️  Platforms: ${platforms.join(', ')}\n`);

    // Generate icons for each platform
    const results: { platform: string; success: boolean; message: string }[] = [];

    for (const platform of platforms) {
        try {
            process.stdout.write(`  Generating ${platform} icons... `);

            switch (platform) {
                case 'windows': {
                    const result = await generateWindowsIcons(absoluteInputPath, outputDir);
                    console.log(`✅ ${path.basename(result.outputPath)}`);
                    results.push({
                        platform,
                        success: true,
                        message: `Created ${path.basename(result.outputPath)} (${result.sizes.join(', ')}px)`
                    });
                    break;
                }

                case 'mac': {
                    const result = await generateMacIcons(absoluteInputPath, outputDir);
                    console.log(`✅ ${path.basename(result.outputPath)} (${result.method})`);
                    results.push({
                        platform,
                        success: true,
                        message: `Created ${path.basename(result.outputPath)} using ${result.method}`
                    });
                    break;
                }

                case 'linux': {
                    const result = await generateLinuxIcons(absoluteInputPath, outputDir);
                    console.log(`✅ ${result.files.length} PNG files`);
                    results.push({
                        platform,
                        success: true,
                        message: `Created ${result.files.length} PNG files (${result.sizes.join(', ')}px)`
                    });
                    break;
                }
            }
        } catch (error) {
            console.log('❌ Failed');
            results.push({
                platform,
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Summary
    console.log('\n📋 Summary:');
    for (const result of results) {
        const icon = result.success ? '✅' : '❌';
        console.log(`  ${icon} ${result.platform}: ${result.message}`);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
        console.log(`\n🎉 All icons generated successfully!\n`);
    } else if (successCount > 0) {
        console.log(`\n⚠️  ${successCount} succeeded, ${failCount} failed.\n`);
        process.exit(1);
    } else {
        console.log(`\n❌ All generations failed.\n`);
        process.exit(1);
    }
}

// CLI configuration
program
    .name('cpdaig')
    .description('Generate desktop application icons for Windows, Mac, and Linux from a single image')
    .version('1.0.0')
    .argument('<image>', 'Path to the source image (PNG, JPG, WEBP, etc.)')
    .option('-o, --output <directory>', 'Output directory (default: ./{filename}-icons in the image directory)')
    .option('-p, --platforms <platforms>', 'Comma-separated list of platforms: windows,mac,linux (default: all)')
    .option('-f, --force', 'Overwrite existing output directory instead of creating a numbered variant')
    .action(generateIcons);

// Show help if no arguments provided
if (process.argv.length <= 2) {
    program.help();
} else {
    program.parse();
}
