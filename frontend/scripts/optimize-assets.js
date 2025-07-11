#!/usr/bin/env node
/**
 * Asset optimization script for CDN deployment
 * Optimizes built assets for better CDN performance
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

// Configuration
const BUILD_DIR = path.resolve(__dirname, '../build');
const COMPRESSIBLE_EXTENSIONS = ['.js', '.css', '.html', '.json', '.xml', '.svg', '.txt'];
const MIN_SIZE_FOR_COMPRESSION = 1024; // 1KB minimum

// Logging utility
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
}

// Get all files recursively
function getAllFiles(dir, arrayOfFiles = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Check if file should be compressed
function shouldCompress(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const stats = fs.statSync(filePath);
  
  return COMPRESSIBLE_EXTENSIONS.includes(ext) && 
         stats.size >= MIN_SIZE_FOR_COMPRESSION;
}

// Compress file with gzip
async function compressWithGzip(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const compressed = await gzip(data, { level: 9 });
    
    // Only keep compressed version if it's smaller
    if (compressed.length < data.length) {
      const gzipPath = `${filePath}.gz`;
      fs.writeFileSync(gzipPath, compressed);
      
      const savings = ((data.length - compressed.length) / data.length * 100).toFixed(1);
      log(`Gzipped ${path.relative(BUILD_DIR, filePath)} (${savings}% smaller)`, 'success');
      
      return {
        originalSize: data.length,
        compressedSize: compressed.length,
        savings: parseFloat(savings)
      };
    }
    
    return null;
  } catch (error) {
    log(`Failed to gzip ${filePath}: ${error.message}`, 'error');
    return null;
  }
}

// Compress file with Brotli
async function compressWithBrotli(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const compressed = await brotli(data, {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length
    });
    
    // Only keep compressed version if it's smaller
    if (compressed.length < data.length) {
      const brotliPath = `${filePath}.br`;
      fs.writeFileSync(brotliPath, compressed);
      
      const savings = ((data.length - compressed.length) / data.length * 100).toFixed(1);
      log(`Brotli compressed ${path.relative(BUILD_DIR, filePath)} (${savings}% smaller)`, 'success');
      
      return {
        originalSize: data.length,
        compressedSize: compressed.length,
        savings: parseFloat(savings)
      };
    }
    
    return null;
  } catch (error) {
    log(`Failed to brotli compress ${filePath}: ${error.message}`, 'error');
    return null;
  }
}

// Optimize HTML files
function optimizeHtml(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalSize = content.length;
    
    // Minify HTML
    content = content
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      .trim();
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    const savings = ((originalSize - content.length) / originalSize * 100).toFixed(1);
    if (savings > 0) {
      log(`Minified ${path.relative(BUILD_DIR, filePath)} (${savings}% smaller)`, 'success');
    }
    
    return {
      originalSize,
      optimizedSize: content.length,
      savings: parseFloat(savings)
    };
  } catch (error) {
    log(`Failed to optimize HTML ${filePath}: ${error.message}`, 'error');
    return null;
  }
}

// Generate cache manifest
function generateCacheManifest(allFiles) {
  const manifest = {
    version: new Date().toISOString(),
    files: {}
  };
  
  allFiles.forEach(filePath => {
    const relativePath = path.relative(BUILD_DIR, filePath);
    const stats = fs.statSync(filePath);
    
    // Skip compressed files and directories
    if (relativePath.endsWith('.gz') || relativePath.endsWith('.br')) {
      return;
    }
    
    manifest.files[relativePath] = {
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      hash: require('crypto')
        .createHash('md5')
        .update(fs.readFileSync(filePath))
        .digest('hex')
    };
  });
  
  const manifestPath = path.join(BUILD_DIR, 'cache-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  log(`Generated cache manifest with ${Object.keys(manifest.files).length} files`, 'success');
  return manifest;
}

// Main optimization function
async function optimizeAssets() {
  log('Starting asset optimization...');
  
  if (!fs.existsSync(BUILD_DIR)) {
    log(`Build directory not found: ${BUILD_DIR}`, 'error');
    process.exit(1);
  }
  
  const allFiles = getAllFiles(BUILD_DIR);
  const compressibleFiles = allFiles.filter(shouldCompress);
  const htmlFiles = allFiles.filter(f => path.extname(f).toLowerCase() === '.html');
  
  log(`Found ${allFiles.length} total files, ${compressibleFiles.length} compressible`);
  
  // Optimize HTML files first
  const htmlStats = [];
  for (const htmlFile of htmlFiles) {
    const result = optimizeHtml(htmlFile);
    if (result) htmlStats.push(result);
  }
  
  // Compress files
  const gzipStats = [];
  const brotliStats = [];
  
  for (const filePath of compressibleFiles) {
    const [gzipResult, brotliResult] = await Promise.all([
      compressWithGzip(filePath),
      compressWithBrotli(filePath)
    ]);
    
    if (gzipResult) gzipStats.push(gzipResult);
    if (brotliResult) brotliStats.push(brotliResult);
  }
  
  // Generate cache manifest
  const manifest = generateCacheManifest(allFiles);
  
  // Generate optimization report
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: allFiles.length,
    htmlOptimization: {
      filesProcessed: htmlStats.length,
      totalSavings: htmlStats.reduce((sum, stat) => sum + (stat.originalSize - stat.optimizedSize), 0)
    },
    gzipCompression: {
      filesProcessed: gzipStats.length,
      totalSavings: gzipStats.reduce((sum, stat) => sum + (stat.originalSize - stat.compressedSize), 0),
      averageSavings: gzipStats.length > 0 ? (gzipStats.reduce((sum, stat) => sum + stat.savings, 0) / gzipStats.length).toFixed(1) : 0
    },
    brotliCompression: {
      filesProcessed: brotliStats.length,
      totalSavings: brotliStats.reduce((sum, stat) => sum + (stat.originalSize - stat.compressedSize), 0),
      averageSavings: brotliStats.length > 0 ? (brotliStats.reduce((sum, stat) => sum + stat.savings, 0) / brotliStats.length).toFixed(1) : 0
    }
  };
  
  const reportPath = path.join(BUILD_DIR, 'optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Summary
  log(`Optimization complete!`, 'success');
  log(`- HTML files optimized: ${report.htmlOptimization.filesProcessed}`);
  log(`- Gzip files created: ${report.gzipCompression.filesProcessed} (avg ${report.gzipCompression.averageSavings}% savings)`);
  log(`- Brotli files created: ${report.brotliCompression.filesProcessed} (avg ${report.brotliCompression.averageSavings}% savings)`);
  log(`- Cache manifest generated with ${Object.keys(manifest.files).length} files`);
  log(`- Optimization report saved to: ${path.relative(process.cwd(), reportPath)}`);
}

// Run optimization if called directly
if (require.main === module) {
  optimizeAssets().catch(error => {
    log(`Optimization failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { optimizeAssets };
