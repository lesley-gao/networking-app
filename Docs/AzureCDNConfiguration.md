# Azure CDN Configuration for WingCompanion

This document describes the Azure CDN setup for optimized static asset delivery and React application hosting.

## Overview

WingCompanion uses Azure CDN to provide:
- **Global content delivery** for static assets (CSS, JS, images, fonts)
- **Optimized React SPA routing** with proper fallback handling
- **Environment-specific configurations** for development, testing, and production
- **Advanced caching strategies** for maximum performance
- **Automatic compression** with gzip and Brotli support

## Architecture

### CDN Endpoints

The infrastructure creates two CDN endpoints per environment:

1. **Static Assets Endpoint** (`/static/`)
   - Source: Azure Storage Account (`$web` container)
   - Purpose: CSS, JavaScript, images, fonts, and other static files
   - Caching: Long-term caching (30 days to 1 year depending on environment)

2. **Application Endpoint** (`/app/`)
   - Source: Azure App Service
   - Purpose: React SPA routing and API proxying
   - Caching: Short-term caching with SPA routing support

### Environment Configuration

| Environment | CDN SKU | Static Cache Duration | App Cache Duration | Geo-Filtering |
|-------------|---------|---------------------|-------------------|---------------|
| Development | Standard_Microsoft | 30 days | 5 minutes | Disabled |
| Test | Standard_Microsoft | 7 days | 5 minutes | Disabled |
| Production | Premium_Verizon | 365 days | 5 minutes | Enabled* |

*Production geo-filtering blocks admin access from certain countries for security.

## File Structure

```
frontend/
├── .env.example              # Environment configuration template
├── .env.development          # Development environment settings
├── .env.production          # Production environment settings
├── vite.config.mjs          # Enhanced Vite configuration for CDN
├── scripts/
│   ├── optimize-assets.js   # Asset optimization for CDN delivery
│   └── compress-assets.js   # Asset compression (gzip/brotli)
└── build/                   # Generated build output
    ├── assets/              # Chunked and optimized assets
    ├── compression-manifest.json  # Compression metadata
    ├── cache-config.json    # Cache configuration
    └── optimization-report.json   # Build optimization report

Scripts/
├── Deploy-Frontend.ps1      # Complete frontend deployment script
└── Build-Frontend.ps1       # Enhanced build script with CDN optimization

infra/bicep/modules/
└── cdn.bicep               # Azure CDN infrastructure template
```

## Build Process

### 1. Frontend Build Configuration

The enhanced `vite.config.mjs` provides:
- **Environment-specific base paths** for CDN integration
- **Optimized chunking** for vendor libraries and framework code
- **Consistent file naming** for better caching
- **Asset organization** by type (fonts, images, styles)
- **Compression optimization** with Terser minification

### 2. Asset Optimization

The build process includes multiple optimization steps:

#### Code Splitting
```javascript
// Automatic chunking strategy
{
  vendor: ['react', 'react-dom'],
  mui: ['@mui/material', '@mui/icons-material'],
  redux: ['@reduxjs/toolkit', 'react-redux'],
  router: ['react-router-dom'],
  forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
  // ... additional chunks
}
```

#### Asset Organization
- **JavaScript**: `/assets/[name]-[hash].js`
- **CSS**: `/assets/styles/[name]-[hash].css`
- **Images**: `/assets/images/[name]-[hash].[ext]`
- **Fonts**: `/assets/fonts/[name]-[hash].[ext]`

#### Compression
- **Gzip compression** for all text-based assets
- **Brotli compression** for modern browsers
- **HTML minification** with whitespace optimization
- **Dead code elimination** in production builds

## Deployment Scripts

### Build Script (`Build-Frontend.ps1`)

Enhanced build process with CDN optimization:

```powershell
# Build for production with CDN optimization
.\Scripts\Build-Frontend.ps1 -Environment prod -CdnBaseUrl "https://mycdn.azureedge.net/app/"

# Development build with local configuration
.\Scripts\Build-Frontend.ps1 -Environment dev

# Generate build analysis and reports
.\Scripts\Build-Frontend.ps1 -Environment prod -Analyze -GenerateReport
```

**Features:**
- Environment-specific configuration generation
- Automated dependency management
- Asset optimization and compression
- Build reporting and analysis
- Source map handling per environment

### Deployment Script (`Deploy-Frontend.ps1`)

Complete deployment automation:

```powershell
# Deploy to development
.\Scripts\Deploy-Frontend.ps1 -Environment dev

# Deploy to production with CDN cache purge
.\Scripts\Deploy-Frontend.ps1 -Environment prod -PurgeCdn

# Preview deployment (What-If mode)
.\Scripts\Deploy-Frontend.ps1 -Environment prod -WhatIf
```

**Features:**
- Automatic CDN URL resolution
- Intelligent build skipping
- Azure Storage blob upload with proper content types
- CDN cache purging
- Comprehensive logging and error handling

## NPM Scripts

Enhanced package.json scripts for CDN-optimized builds:

```json
{
  "scripts": {
    "build:dev": "vite build --mode development",
    "build:test": "vite build --mode test",
    "build:prod": "vite build --mode production",
    "build:cdn": "vite build --mode production && npm run optimize:assets",
    "analyze": "npm run build && npx vite-bundle-analyzer build/assets",
    "deploy:dev": "pwsh ../Scripts/Deploy-Frontend.ps1 -Environment dev",
    "deploy:test": "pwsh ../Scripts/Deploy-Frontend.ps1 -Environment test -PurgeCdn",
    "deploy:prod": "pwsh ../Scripts/Deploy-Frontend.ps1 -Environment prod -PurgeCdn"
  }
}
```

## Environment Variables

### Development (`.env.development`)
```bash
VITE_CDN_BASE_URL=/
VITE_CDN_STATIC_ASSETS_URL=/
VITE_API_BASE_URL=http://localhost:5000
VITE_ENVIRONMENT=development
VITE_ENABLE_DEBUG=true
```

### Production (`.env.production`)
```bash
VITE_CDN_BASE_URL=https://flightcompanion-prod-cdn.azureedge.net/app/
VITE_CDN_STATIC_ASSETS_URL=https://flightcompanion-prod-cdn.azureedge.net/static/
VITE_API_BASE_URL=https://flightcompanion-prod-app.azurewebsites.net
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
```

## Caching Strategy

### Static Assets Caching
- **JavaScript/CSS**: 1 year cache with immutable flag
- **Images**: 30 days cache
- **Fonts**: 1 year cache with immutable flag
- **HTML**: 5 minutes cache with must-revalidate

### CDN Delivery Rules

#### Static Assets Endpoint
- **Cache all static files** with long-term expiration
- **Enable compression** for text-based assets
- **Set proper MIME types** for all file extensions
- **Implement cache-busting** through file hashing

#### Application Endpoint
- **SPA routing support** with URL rewrite to `/index.html`
- **API request passthrough** to backend services
- **Short-term caching** for HTML content
- **HTTPS redirect enforcement**

## Performance Optimizations

### Asset Loading
- **Preload critical resources** (fonts, key CSS)
- **Lazy load images** with intersection observer
- **Code splitting** for route-based loading
- **Service worker** for offline functionality (production)

### CDN Features
- **HTTP/2 push** for critical resources
- **Brotli compression** for modern browsers
- **WebP image format** support
- **Edge-side includes** for dynamic content

### Monitoring
- **Real User Monitoring** through Application Insights
- **CDN analytics** through Azure Monitor
- **Performance budgets** in build process
- **Bundle size tracking** and alerts

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CDN endpoints have proper CORS configuration
   - Check API base URL configuration in environment files

2. **Cache Issues**
   - Use CDN purge functionality after deployments
   - Verify cache headers in CDN delivery rules

3. **Routing Problems**
   - Confirm SPA routing rules in CDN configuration
   - Check URL rewrite rules for React Router

4. **Asset Loading Failures**
   - Verify CDN endpoint accessibility
   - Check asset path configuration in Vite build

### Debugging Commands

```powershell
# Check CDN endpoint status
az cdn endpoint show --name <endpoint-name> --profile-name <profile-name> --resource-group <rg-name>

# Purge CDN cache
az cdn endpoint purge --name <endpoint-name> --profile-name <profile-name> --resource-group <rg-name> --content-paths "/*"

# Validate build output
npm run build:prod && ls -la build/assets/

# Test compression
curl -H "Accept-Encoding: gzip" -I https://your-cdn-endpoint/static/assets/app.js
```

## Security Considerations

### Production Security
- **HTTPS enforcement** for all CDN traffic
- **Geo-filtering** to block access from high-risk countries
- **WAF integration** for application protection
- **Content security policy** headers

### Access Control
- **Azure AD integration** for administrative access
- **IP whitelisting** for deployment scripts
- **Managed identity** for resource access
- **Key rotation** for storage account keys

## Next Steps

After completing TASK-089 CDN configuration:

1. **TASK-090**: Implement GitHub Actions CI/CD pipeline
2. **Performance monitoring** setup with Application Insights
3. **Security hardening** with Azure Security Center
4. **Cost optimization** through Azure Advisor recommendations

## Resources

- [Azure CDN Documentation](https://docs.microsoft.com/en-us/azure/cdn/)
- [Vite Build Optimization Guide](https://vitejs.dev/guide/build.html)
- [React Performance Best Practices](https://react.dev/learn/render-and-commit)
- [Azure Well-Architected Framework](https://docs.microsoft.com/en-us/azure/architecture/framework/)
