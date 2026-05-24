import { mkdirSync, existsSync, writeFileSync, cpSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🚀 Starting Netlify build preparation...');

// Build outputs to dist/ by default
const serverDir = join(rootDir, 'dist', 'server');
const clientDir = join(rootDir, 'dist', 'client');

// Check if build output exists
if (!existsSync(serverDir)) {
  console.error('❌ Server build not found at dist/server');
  process.exit(1);
}

if (!existsSync(clientDir)) {
  console.error('❌ Client build not found at dist/client');
  process.exit(1);
}

console.log('✅ Build output found');

// Clean and create .output directory
const outputDir = join(rootDir, '.output');
if (existsSync(outputDir)) {
  rmSync(outputDir, { recursive: true, force: true });
}
mkdirSync(outputDir, { recursive: true });

// Copy client files to .output/public for Netlify
const outputPublicDir = join(outputDir, 'public');
cpSync(clientDir, outputPublicDir, { recursive: true });
console.log('✅ Copied client files to .output/public');

// Copy server files to .output/server
const outputServerDir = join(outputDir, 'server');
cpSync(serverDir, outputServerDir, { recursive: true });
console.log('✅ Copied server files to .output/server');

// Create netlify functions directory
const netlifyFunctionsDir = join(rootDir, 'netlify', 'functions');
if (existsSync(netlifyFunctionsDir)) {
  rmSync(netlifyFunctionsDir, { recursive: true, force: true });
}
mkdirSync(netlifyFunctionsDir, { recursive: true });

// Create a package.json for the function to mark it as ESM
const functionPackageJson = {
  type: "module"
};
writeFileSync(
  join(netlifyFunctionsDir, 'package.json'),
  JSON.stringify(functionPackageJson, null, 2)
);

// Create a Netlify function that imports the TanStack Start server
const functionContent = `import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamically import the server entry
const serverModule = await import('../../.output/server/server.js');
const serverEntry = serverModule.default;

export const handler = async (event, context) => {
  try {
    // Build the full URL from Netlify event
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const host = event.headers.host;
    const path = event.path;
    const queryString = event.rawQuery ? '?' + event.rawQuery : '';
    const url = \`\${protocol}://\${host}\${path}\${queryString}\`;
    
    // Create a Web Request object
    const headers = new Headers();
    Object.entries(event.headers).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });

    const requestInit = {
      method: event.httpMethod,
      headers: headers,
    };

    // Add body if present
    if (event.body) {
      if (event.isBase64Encoded) {
        requestInit.body = Buffer.from(event.body, 'base64').toString();
      } else {
        requestInit.body = event.body;
      }
    }

    const request = new Request(url, requestInit);

    // Call the TanStack Start server handler
    const response = await serverEntry.fetch(request, {
      KV_REST_API_URL: process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    }, context);
    
    // Convert Web Response to Netlify response format
    const responseBody = await response.text();
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    console.error('❌ Function error:', error);
    console.error('Stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: \`<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
  <h1>Internal Server Error</h1>
  <p>\${error.message}</p>
  <pre>\${error.stack}</pre>
</body>
</html>\`,
    };
  }
};
`;

// Write the Netlify function
const functionPath = join(netlifyFunctionsDir, 'render.mjs');
writeFileSync(functionPath, functionContent);
console.log('✅ Created Netlify function at netlify/functions/render.mjs');

console.log('✅ Netlify build preparation complete!');
