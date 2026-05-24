# ShareText - Zero-Knowledge Encrypted Text Sharing

A secure, privacy-focused text sharing application with end-to-end encryption. Your text is encrypted in the browser before being sent to the server - we can't read it, even if we wanted to.

## Features

- 🔒 **Zero-Knowledge Encryption** - AES-256-GCM encryption in browser
- ⏱️ **Auto-Expiring** - Choose from 5 min to 7 days
- 🔥 **Burn After Reading** - One-time view option
- 🔑 **Password Protection** - Optional additional security layer
- 📱 **QR Code Sharing** - Easy mobile sharing
- 💾 **Download Options** - Save as text file
- 🎨 **Modern UI** - Clean, responsive design

## Tech Stack

- **Frontend**: React 19 + TanStack Start + TailwindCSS
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Storage**: Vercel KV (Redis)
- **Deployment**: Vercel

## Setup

1. **Clone and install dependencies:**
```bash
npm install
# or
bun install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add:
- `ADMIN_PASSWORD` - Your admin dashboard password
- `KV_REST_API_URL` - From Upstash Redis dashboard
- `KV_REST_API_TOKEN` - From Upstash Redis dashboard

3. **Run development server:**
```bash
npm run dev
# or
bun run dev
```

4. **Build for production:**
```bash
npm run build
```

## Deploy to Netlify

### Option 1: Connect GitHub Repository (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Go to Netlify:**
   - Visit: https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select your `share-text` repository

3. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.output/public`
   - Functions directory: `.output/server`
   - Click "Deploy site"

4. **Add Environment Variables:**
   - Go to Site settings → Environment variables
   - Add these variables:
     ```
     ADMIN_PASSWORD=your-secure-password
     KV_REST_API_URL=your-upstash-redis-url
     KV_REST_API_TOKEN=your-upstash-redis-token
     ```

5. **Redeploy:**
   - Go to Deploys → Trigger deploy → Deploy site

### Option 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

Your site will be live at: `https://your-site-name.netlify.app`

1. Go to https://console.upstash.com/
2. Sign up (use GitHub login)
3. Click "Create Database"
4. Choose:
   - Name: `sharetext`
   - Type: **Regional** (free tier)
   - Region: Closest to you
5. After creation, scroll to **"REST API"** section
6. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
7. Add them to your `.env` file as `KV_REST_API_URL` and `KV_REST_API_TOKEN`

## Security

- **Client-side encryption**: Text is encrypted before leaving your browser
- **Zero-knowledge**: Server only stores encrypted blobs
- **Key in URL fragment**: Encryption key stays in URL hash (#), never sent to server
- **Auto-expiration**: All pastes automatically delete after expiration
- **Optional password**: Add extra layer with PBKDF2 key derivation

## Admin Dashboard

Access at `/admin` with your `ADMIN_PASSWORD`. View metadata (but not content) of all pastes.

## License

MIT
