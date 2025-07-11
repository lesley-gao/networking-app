#!/usr/bin/env node
/**
 * Asset compression script for CDN deployment
 * Creates compressed versions of static assets for optimal CDN delivery
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const crypto = require('crypto');

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

// Configuration
const BUILD_DIR = path.resolve(__dirname, '../build');
const COMPRESSIBLE_TYPES = {
  '.js': { type: 'application/javascript', compress: true },
  '.css': { type: 'text/css', compress: true },
  '.html': { type: 'text/html', compress: true },
  '.json': { type: 'application/json', compress: true },
  '.xml': { type: 'application/xml', compress: true },
  '.svg': { type: 'image/svg+xml', compress: true },
  '.txt': { type: 'text/plain', compress: true },
  '.ico': { type: 'image/x-icon', compress: false },
  '.png': { type: 'image/png', compress: false },
  '.jpg': { type: 'image/jpeg', compress: false },
  '.jpeg': { type: 'image/jpeg', compress: false },
  '.gif': { type: 'image/gif', compress: false },
  '.webp': { type: 'image/webp', compress: false },
  '.woff': { type: 'font/woff', compress: false },
  '.woff2': { type: 'font/woff2', compress: false }
};

const MIN_COMPRESSION_SIZE = 1024; // 1KB

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

function getFileHash(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
}

function shouldCompress(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const config = COMPRESSIBLE_TYPES[ext];
  const stats = fs.statSync(filePath);
  
  return config && config.compress && stats.size >= MIN_COMPRESSION_SIZE;
}

async function compressFile(filePath, algorithm = 'gzip') {
  try {
    const data = fs.readFileSync(filePath);
    let compressed;
    let extension;
    
    if (algorithm === 'gzip') {
      compressed = await gzip(data, { level: 9 });
      extension = '.gz';
    } else if (algorithm === 'brotli') {
      compressed = await brotli(data, {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length
      });
      extension = '.br';
    } else {
      throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
    
    // Only create compressed file if it's actually smaller
    if (compressed.length < data.length) {
      const compressedPath = `${filePath}${extension}`;
      fs.writeFileSync(compressedPath, compressed);
      
      const savings = ((data.length - compressed.length) / data.length * 100).toFixed(1);
      const relativePath = path.relative(BUILD_DIR, filePath);
      
      log(`${algorithm}: ${relativePath} (${savings}% reduction)`, 'success');
      
      return {
        filePath: relativePath,
        originalSize: data.length,
        compressedSize: compressed.length,
        savings: parseFloat(savings),
        algorithm
      };
    } else {
      log(`${algorithm}: ${path.relative(BUILD_DIR, filePath)} (no benefit)`, 'warn');
      return null;
    }
  } catch (error) {
    log(`Failed to compress ${filePath} with ${algorithm}: ${error.message}`, 'error');
    return null;
  }
}

function generateCompressionManifest(results, allFiles) {
  const manifest = {
    generated: new Date().toISOString(),
    compressionResults: results.filter(r => r !== null),
    fileIndex: {}
  };
  
  // Create file index with metadata
  allFiles.forEach(filePath => {
    const relativePath = path.relative(BUILD_DIR, filePath);
    const ext = path.extname(filePath).toLowerCase();
    const config = COMPRESSIBLE_TYPES[ext];
    const stats = fs.statSync(filePath);
    
    // Skip already compressed files
    if (relativePath.endsWith('.gz') || relativePath.endsWith('.br')) {
      return;
    }
    
    const fileInfo = {
      size: stats.size,
      type: config ? config.type : 'application/octet-stream',
      hash: getFileHash(filePath),
      lastModified: stats.mtime.toISOString(),
      compressed: {
        gzip: fs.existsSync(`${filePath}.gz`),
        brotli: fs.existsSync(`${filePath}.br`)
      }
    };
    
    // Add compression info if available
    const compressionResult = results.find(r => r && r.filePath === relativePath);
    if (compressionResult) {
      fileInfo.compressionSavings = compressionResult.savings;
    }
    
    manifest.fileIndex[relativePath] = fileInfo;
  });
  
  return manifest;
}

function generateCacheHeaders() {
  const cacheConfig = {
    generated: new Date().toISOString(),
    rules: []
  };
  
  // Define cache rules based on file types
  const cacheRules = {
    'text/html': {
      maxAge: 300, // 5 minutes for HTML
      mustRevalidate: true
    },
    'application/javascript': {
      maxAge: 31536000, // 1 year for JS
      immutable: true
    },
    'text/css': {
      maxAge: 31536000, // 1 year for CSS
      immutable: true
    },
    'image/': {
      maxAge: 2592000, // 30 days for images
      pattern: 'startsWith'
    },
    'font/': {
      maxAge: 31536000, // 1 year for fonts
      pattern: 'startsWith'
    },
    'application/json': {
      maxAge: 300, // 5 minutes for JSON
      mustRevalidate: true
    }
  };
  
  Object.entries(cacheRules).forEach(([type, config]) => {
    cacheConfig.rules.push({
      contentType: type,
      ...config
    });
  });
  
  return cacheConfig;
}

async function compressAssets() {
  log('Starting asset compression...');
  
  if (!fs.existsSync(BUILD_DIR)) {
    log(`Build directory not found: ${BUILD_DIR}`, 'error');
    process.exit(1);
  }
  
  const allFiles = getAllFiles(BUILD_DIR);
  const compressibleFiles = allFiles.filter(shouldCompress);
  
  log(`Found ${allFiles.length} total files`);
  log(`Compressing ${compressibleFiles.length} eligible files`);
  
  const results = [];
  
  // Compress files with both gzip and brotli
  for (const filePath of compressibleFiles) {
    const [gzipResult, brotliResult] = await Promise.all([
      compressFile(filePath, 'gzip'),
      compressFile(filePath, 'brotli')
    ]);
    
    if (gzipResult) results.push(gzipResult);
    if (brotliResult) results.push(brotliResult);
  }
  
  // Generate compression manifest
  const manifest = generateCompressionManifest(results, allFiles);
  const manifestPath = path.join(BUILD_DIR, 'compression-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Generate cache configuration
  const cacheConfig = generateCacheHeaders(manifest);
  const cacheConfigPath = path.join(BUILD_DIR, 'cache-config.json');
  fs.writeFileSync(cacheConfigPath, JSON.stringify(cacheConfig, null, 2));
  
  // Calculate totals
  const gzipResults = results.filter(r => r.algorithm === 'gzip');
  const brotliResults = results.filter(r => r.algorithm === 'brotli');
  
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalGzipSize = gzipResults.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalBrotliSize = brotliResults.reduce((sum, r) => sum + r.compressedSize, 0);
  
  const avgGzipSavings = gzipResults.length > 0 ? 
    (gzipResults.reduce((sum, r) => sum + r.savings, 0) / gzipResults.length).toFixed(1) : 0;
  const avgBrotliSavings = brotliResults.length > 0 ? 
    (brotliResults.reduce((sum, r) => sum + r.savings, 0) / brotliResults.length).toFixed(1) : 0;
  
  // Summary
  log('Compression complete!', 'success');
  log(`Files processed: ${compressibleFiles.length}`);
  log(`Gzip compressed: ${gzipResults.length} files (avg ${avgGzipSavings}% savings)`);
  log(`Brotli compressed: ${brotliResults.length} files (avg ${avgBrotliSavings}% savings)`);
  log(`Total original size: ${(totalOriginalSize / 1024).toFixed(1)} KB`);
  log(`Total gzip size: ${(totalGzipSize / 1024).toFixed(1)} KB`);
  log(`Total brotli size: ${(totalBrotliSize / 1024).toFixed(1)} KB`);
  log(`Compression manifest: ${path.relative(process.cwd(), manifestPath)}`);
  log(`Cache configuration: ${path.relative(process.cwd(), cacheConfigPath)}`);
}

// Run compression if called directly
if (require.main === module) {
  compressAssets().catch(error => {
    log(`Compression failed: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { compressAssets };
