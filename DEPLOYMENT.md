# Netlify Deployment Guide

## What Was Fixed

The Netlify deployment was failing because the `@lovable.dev/vite-tanstack-config` package includes a Cloudflare Vite plugin by default, which was looking for `.output/server/index.mjs` that doesn't exist in a standard TanStack Start build.

### Changes Made:

1. **vite.config.ts**: Added `cloudflare: false` option to disable the Cloudflare plugin
2. **scripts/netlify-build.mjs**: Updated to:
   - Handle build output from `dist/` directory
   - Copy files to `.output/` for Netlify
   - Create a proper Netlify function wrapper at `netlify/functions/render.mjs`
3. **netlify.toml**: Added external node modules configuration for `@vercel/kv` and `@tanstack/react-start`

## Build Process

When you run `npm run build`, the following happens:

1. Vite builds the client to `dist/client/`
2. Vite builds the server to `dist/server/`
3. The build script copies everything to `.output/` directory
4. A Netlify function wrapper is created that imports the TanStack Start server

## Netlify Configuration

Your site is configured with:
- **Build command**: `npm run build`
- **Publish directory**: `.output/public`
- **Functions directory**: `netlify/functions`
- **Redirect**: All requests go to `/.netlify/functions/render`

## Environment Variables

Make sure these are set in your Netlify dashboard:

```
ADMIN_PASSWORD=MyCustomPassword2024!
KV_REST_API_URL=https://devoted-anteater-101431.upstash.io
KV_REST_API_TOKEN=gQAAAAAAAYw3AAIgcDJlMWEzNjNkOTJkMDE0N2I5YjI3ZjZiMTE1ODgzZTZmOQ
```

## Next Steps

1. Go to your Netlify dashboard: https://app.netlify.com
2. Find your site (connected to the `share-text` repository)
3. The deployment should automatically trigger from the latest push
4. Monitor the build logs to ensure it completes successfully
5. Once deployed, test the application:
   - Create a paste
   - Verify the 8-character paste ID
   - Test the 7-digit decryption key
   - Check the admin dashboard at `/admin`

## Testing Locally

To test the build locally:

```bash
npm run build
```

This will create the `.output/` directory and `netlify/functions/render.mjs` file.

## Features

Your ShareText application includes:

- ✅ Client-side AES-256-GCM encryption
- ✅ Two-factor security: URL + 7-digit decryption key
- ✅ 8-character paste IDs
- ✅ Auto-expiration (5 minutes to 7 days)
- ✅ Burn-after-reading option
- ✅ Password protection
- ✅ QR code generation (collapsible)
- ✅ Admin dashboard at `/admin`
- ✅ Upstash Redis storage (free tier)

## Troubleshooting

If the deployment fails:

1. Check the Netlify build logs for errors
2. Verify environment variables are set correctly
3. Ensure the Upstash Redis instance is accessible
4. Check that the build completes successfully locally

## Support

If you encounter issues, check:
- Netlify build logs
- Browser console for client-side errors
- Netlify function logs for server-side errors
