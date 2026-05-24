import { mkdirSync, existsSync, writeFileSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Create netlify functions directory
const netlifyFunctionsDir = join(rootDir, 'netlify', 'functions');

if (!existsSync(netlifyFunctionsDir)) {
  mkdirSync(netlifyFunctionsDir, { recursive: true });
}

// Copy the entire .output/server to netlify/functions
const serverDir = join(rootDir, '.output', 'server');
const targetDir = join(netlifyFunctionsDir, 'server');

if (existsSync(serverDir)) {
  cpSync(serverDir, targetDir, { recursive: true });
  console.log('✅ Copied server files to netlify/functions/server');
}

// Create a Netlify function wrapper
const wrapperContent = `
const { handler: startHandler } = require('./server/index.mjs');

exports.handler = async (event, context) => {
  try {
    // Build URL from Netlify event
    const url = event.rawUrl || \`https://\${event.headers.host}\${event.path}\`;
    
    // Create Request object
    const request = new Request(url, {
      method: event.httpMethod,
      headers: new Headers(event.headers),
      body: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body) : undefined,
    });

    // Call TanStack Start handler
    const response = await startHandler(request);
    
    // Convert Response to Netlify format
    const body = await response.text();
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      statusCode: response.status,
      headers,
      body,
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
`;

// Write the wrapper
writeFileSync(join(netlifyFunctionsDir, 'render.js'), wrapperContent);

console.log('✅ Netlify function wrapper created at netlify/functions/render.js');

