import { mkdirSync, existsSync, writeFileSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🚀 Starting Netlify build preparation...');

// Check for build output in dist/ or .output/
let serverDir = join(rootDir, '.output', 'server');
let clientDir = join(rootDir, '.output', 'public');

if (!existsSync(serverDir)) {
  serverDir = join(rootDir, 'dist', 'server');
  clientDir = join(rootDir, 'dist', 'client');
}

// Check if build output exists
if (!existsSync(serverDir)) {
  console.error('❌ Server build not found at .output/server or dist/server');
  process.exit(1);
}

if (!existsSync(clientDir)) {
  console.error('❌ Client build not found at .output/public or dist/client');
  process.exit(1);
}

console.log('✅ Build output found at:', serverDir);

// Copy client files to .output/public for Netlify
const outputPublicDir = join(rootDir, '.output', 'public');
if (!existsSync(join(rootDir, '.output'))) {
  mkdirSync(join(rootDir, '.output'), { recursive: true });
}
cpSync(clientDir, outputPublicDir, { recursive: true });
console.log('✅ Copied client files to .output/public');

// Copy server files to .output/server
const outputServerDir = join(rootDir, '.output', 'server');
cpSync(serverDir, outputServerDir, { recursive: true });
console.log('✅ Copied server files to .output/server');

// Create netlify functions directory
const netlifyFunctionsDir = join(rootDir, 'netlify', 'functions');
if (!existsSync(netlifyFunctionsDir)) {
  mkdirSync(netlifyFunctionsDir, { recursive: true });
}

// Create a Netlify function that imports the TanStack Start server
const functionContent = `
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import the server entry
let serverEntry;
try {
  const serverModule = await import('../../.output/server/server.js');
  serverEntry = serverModule.default;
} catch (error) {
  console.error('Failed to import server:', error);
  throw error;
}

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
      headers.set(key, value);
    });

    const request = new Request(url, {
      method: event.httpMethod,
      headers: headers,
      body: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : undefined,
    });

    // Call the TanStack Start server handler
    const response = await serverEntry.fetch(request, {}, context);
    
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>Internal Server Error</h1><p>' + error.message + '</p>',
    };
  }
};
`;

// Write the Netlify function
const functionPath = join(netlifyFunctionsDir, 'render.mjs');
writeFileSync(functionPath, functionContent);
console.log('✅ Created Netlify function at netlify/functions/render.mjs');

console.log('✅ Netlify build preparation complete!');
