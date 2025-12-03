# 🚀 Deployment Guide

Complete guide for deploying your Real-Time Object Detection app to various hosting platforms.

## 📋 Pre-Deployment Checklist

- [ ] ONNX model file (`yolov8n.onnx`) is in `public/models/`
- [ ] Application builds successfully (`npm run build`)
- [ ] Model path is correct in `src/utils/constants.js`
- [ ] Camera permissions are handled properly
- [ ] Test in production mode locally (`npm run preview`)

---

## 🌐 Platform-Specific Guides

### 1. Netlify (Recommended)

**Why Netlify?**

- Free tier with generous limits
- Automatic HTTPS
- Easy continuous deployment
- Great for static sites

**Deployment Steps:**

#### Option A: Drag & Drop

1. Build your project:

   ```bash
   npm run build
   ```

2. Visit [Netlify Drop](https://app.netlify.com/drop)

3. Drag and drop the `dist/` folder

4. Your site is live! 🎉

#### Option B: Git Integration

1. Push your code to GitHub/GitLab/Bitbucket

2. Log in to [Netlify](https://app.netlify.com)

3. Click "Add new site" → "Import an existing project"

4. Connect your repository

5. Configure build settings:

   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

6. Click "Deploy site"

**Configuration File** (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Embedder-Policy = "require-corp"
    Cross-Origin-Opener-Policy = "same-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 2. Vercel

**Why Vercel?**

- Excellent performance
- Zero configuration
- Built-in CI/CD
- Great developer experience

**Deployment Steps:**

#### Option A: Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Deploy:

   ```bash
   vercel
   ```

3. Follow the prompts

#### Option B: Git Integration

1. Push code to GitHub

2. Visit [Vercel](https://vercel.com)

3. Click "Add New Project"

4. Import your repository

5. Vercel auto-detects Vite, just click "Deploy"

**Configuration File** (`vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

---

### 3. GitHub Pages

**Why GitHub Pages?**

- Free hosting
- Direct from repository
- Good for open source projects

**Deployment Steps:**

1. Install `gh-pages` package:

   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:

   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/realTimeOD"
   }
   ```

3. Update `vite.config.js`:

   ```javascript
   export default defineConfig({
     base: "/realTimeOD/", // Your repo name
     // ... rest of config
   });
   ```

4. Deploy:

   ```bash
   npm run deploy
   ```

5. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: `gh-pages`

**Note**: Camera access may require custom domain with HTTPS.

---

### 4. Cloudflare Pages

**Why Cloudflare?**

- Global CDN
- Excellent performance
- Unlimited bandwidth (free tier)
- Built-in analytics

**Deployment Steps:**

1. Push code to GitHub

2. Visit [Cloudflare Pages](https://pages.cloudflare.com)

3. Click "Create a project"

4. Connect your repository

5. Build settings:

   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

6. Deploy

**Headers Configuration** (in Cloudflare dashboard):

Add custom headers in Cloudflare Pages settings:

- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

---

### 5. Firebase Hosting

**Why Firebase?**

- Google infrastructure
- Easy CLI deployment
- Good integration with other Firebase services

**Deployment Steps:**

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Login:

   ```bash
   firebase login
   ```

3. Initialize:

   ```bash
   firebase init hosting
   ```

   Select:

   - Public directory: `dist`
   - Single-page app: `Yes`
   - GitHub integration: Optional

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

**Configuration** (`firebase.json`):

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cross-Origin-Embedder-Policy",
            "value": "require-corp"
          },
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin"
          }
        ]
      }
    ]
  }
}
```

---

## 🔧 Important Configuration Notes

### HTTPS Requirement

Camera access **requires HTTPS** in production. All recommended platforms provide automatic HTTPS.

For custom domains:

- Ensure SSL certificate is active
- Force HTTPS redirects

### Cross-Origin Headers

For optimal ONNX Runtime performance with WebGPU, set these headers:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### Model File Size

The `yolov8n.onnx` file is ~6MB. Ensure:

- It's included in your build
- Your hosting platform supports files of this size
- It's in the correct path (`public/models/`)

---

## 🧪 Testing Deployment

After deployment, test these features:

1. **Camera Access**: Allow permissions and verify video stream
2. **Model Loading**: Check console for loading errors
3. **WebGPU**: Verify execution provider in UI
4. **Detection**: Test object detection works smoothly
5. **Mobile**: Test on mobile devices
6. **Performance**: Check FPS on different devices

---

## 🐛 Common Deployment Issues

### Issue: "Model not found"

**Solution**: Ensure `yolov8n.onnx` is in `public/models/` before building.

### Issue: Camera not working

**Solutions**:

- Verify HTTPS is enabled
- Check browser permissions
- Test in different browsers

### Issue: CORS errors

**Solutions**:

- Add proper headers (see platform-specific guides)
- Ensure model is served from same origin

### Issue: WebGPU not working

**Solutions**:

- Check browser compatibility
- App falls back to WebAssembly automatically
- Update browser to latest version

### Issue: Blank page after deployment

**Solutions**:

- Check base path in `vite.config.js`
- Verify build output directory
- Check browser console for errors

---

## 📊 Performance Optimization for Production

### 1. Optimize Build

```javascript
// vite.config.js
export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs
      },
    },
  },
});
```

### 2. Enable Compression

Most platforms handle this automatically, but verify:

- Gzip compression enabled
- Brotli compression (better than gzip)

### 3. CDN Configuration

Ensure static assets are cached:

- Model file: Cache for 1 year
- JS/CSS: Cache with hash-based names
- HTML: No cache or short cache

### 4. Monitor Performance

Use built-in platform analytics:

- Netlify Analytics
- Vercel Analytics
- Cloudflare Web Analytics

---

## 🔄 Continuous Deployment

### Automatic Deployments

Most platforms support automatic deployments on git push:

1. **Netlify**: Auto-deploys on push to main branch
2. **Vercel**: Auto-deploys on push
3. **Cloudflare Pages**: Auto-deploys on push

### Manual Deployments

For more control:

```bash
# Build locally
npm run build

# Deploy using platform CLI
netlify deploy --prod
# or
vercel --prod
# or
firebase deploy
```

---

## 💰 Cost Considerations

All recommended platforms offer generous free tiers:

- **Netlify**: 100GB bandwidth/month (free)
- **Vercel**: 100GB bandwidth/month (free)
- **GitHub Pages**: Unlimited (for public repos)
- **Cloudflare Pages**: Unlimited bandwidth (free)
- **Firebase Hosting**: 10GB storage, 360MB/day transfer (free)

For most use cases, **free tier is sufficient**.

---

## 🎯 Recommended Platform

**For this project, we recommend Netlify**:

- Easiest setup
- Great free tier
- Excellent documentation
- Automatic HTTPS
- Easy custom domain setup

---

## 📞 Getting Help

If you encounter deployment issues:

1. Check platform-specific documentation
2. Review this guide's troubleshooting section
3. Check browser console for errors
4. Verify all files are included in build
5. Test locally with `npm run preview` first

---

**Happy Deploying! 🚀**
