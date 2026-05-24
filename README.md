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
- `KV_REST_API_URL` - From Vercel KV dashboard
- `KV_REST_API_TOKEN` - From Vercel KV dashboard

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

## Vercel KV Setup

1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database → KV
3. Copy the `KV_REST_API_URL` and `KV_REST_API_TOKEN`
4. Add them to your `.env` file

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
