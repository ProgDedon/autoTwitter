const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');
const fs = require('fs').promises;

const PORT = 3002; // Use different port to avoid conflict
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const DATA_FILE = './server/accounts.json';
const STORE_KEY = process.env.ACCOUNT_STORE_KEY || 'dev-key-change-in-production-32b';

// Utility functions
function base64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(STORE_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

async function readStore() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed || !Array.isArray(parsed.accounts)) {
      return { accounts: [] };
    }
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') return { accounts: [] };
    return { accounts: [] };
  }
}

async function writeStore(store) {
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

async function verifyWithOAuth2(token) {
  const url = 'https://api.twitter.com/2/users/me';
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OAuth 2.0 verification failed: ${response.status} ${text}`);
  }
  const json = await response.json();
  return {
    id: json.data.id,
    username: json.data.username,
    name: json.data.name
  };
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         Twitter OAuth 2.0 User Context Setup Tool             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

This tool will help you connect your Twitter account with proper
User Context tokens that allow posting tweets.

BEFORE YOU START:
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Select your App → "User authentication settings"
3. Set "App permissions" to "Read and write"
4. Set "Type of App" to "Web App"
5. Add Callback URL: ${REDIRECT_URI}
6. Save changes and note your Client ID

`);

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => readline.question(query, resolve));
}

let pkceData = {};
let server;

const app = express();

app.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state || state !== pkceData.state) {
      return res.send(`
        <html>
          <body style="font-family: Arial; background: #1a1a1a; color: #fff; padding: 40px; text-align: center;">
            <h1 style="color: #ff4444;">❌ Authorization Failed</h1>
            <p>Invalid state or missing code. Please try again.</p>
          </body>
        </html>
      `);
    }
    
    console.log('\n✓ Authorization code received!');
    console.log('  Exchanging code for access token...');
    
    // Exchange code for token
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('client_id', pkceData.clientId);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('code_verifier', pkceData.codeVerifier);
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('✓ Access token received!');
    
    // Verify token and get user info
    console.log('  Verifying with Twitter API...');
    const userInfo = await verifyWithOAuth2(tokenData.access_token);
    console.log(`✓ User verified: @${userInfo.username} (${userInfo.name})`);
    
    // Store account
    console.log('  Saving account to accounts.json...');
    const store = await readStore();
    
    if (!Array.isArray(store.accounts)) {
      store.accounts = [];
    }
    
    // Remove any existing account with same ID
    store.accounts = store.accounts.filter(acc => acc.id !== userInfo.id);
    
    const accountRecord = {
      id: userInfo.id,
      username: userInfo.username,
      name: userInfo.name,
      authType: 'oauth2',
      encryptedAccessToken: encrypt(tokenData.access_token),
      encryptedRefreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
      encryptedClientId: encrypt(pkceData.clientId),
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      verified: true,
      addedAt: new Date().toISOString()
    };
    
    // Remove undefined fields
    Object.keys(accountRecord).forEach(key => 
      accountRecord[key] === undefined && delete accountRecord[key]
    );
    
    store.accounts.push(accountRecord);
    await writeStore(store);
    
    console.log('✓ Account saved successfully!\n');
    console.log('═════════════════════════════════════════════════════════');
    console.log('  SUCCESS! Account Connected');
    console.log('═════════════════════════════════════════════════════════');
    console.log(`  Username: @${userInfo.username}`);
    console.log(`  Name: ${userInfo.name}`);
    console.log(`  ID: ${userInfo.id}`);
    console.log(`  Token Expires: ${new Date(accountRecord.expiresAt).toLocaleString()}`);
    console.log(`  Has Refresh Token: ${tokenData.refresh_token ? 'Yes' : 'No'}`);
    console.log('═════════════════════════════════════════════════════════\n');
    
    res.send(`
      <html>
        <head>
          <title>Twitter OAuth Success</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              color: #fff;
              padding: 40px;
              text-align: center;
              margin: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(255,255,255,0.05);
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            }
            .check {
              font-size: 80px;
              color: #4ade80;
              margin-bottom: 20px;
            }
            h1 {
              color: #4ade80;
              margin: 0 0 10px 0;
            }
            .info {
              background: rgba(0,0,0,0.3);
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              text-align: left;
            }
            .info-row {
              margin: 10px 0;
              display: flex;
              justify-content: space-between;
            }
            .label {
              color: #9ca3af;
            }
            .value {
              color: #fff;
              font-weight: bold;
            }
            button {
              background: #1d9bf0;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-top: 20px;
            }
            button:hover {
              background: #1a8cd8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="check">✓</div>
            <h1>Account Connected Successfully!</h1>
            <p>Your Twitter account has been connected with User Context permissions.</p>
            
            <div class="info">
              <div class="info-row">
                <span class="label">Username:</span>
                <span class="value">@${userInfo.username}</span>
              </div>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${userInfo.name}</span>
              </div>
              <div class="info-row">
                <span class="label">User ID:</span>
                <span class="value">${userInfo.id}</span>
              </div>
              <div class="info-row">
                <span class="label">Token Type:</span>
                <span class="value">OAuth 2.0 User Context</span>
              </div>
              <div class="info-row">
                <span class="label">Refresh Token:</span>
                <span class="value">${tokenData.refresh_token ? '✓ Available' : '✗ Not provided'}</span>
              </div>
            </div>
            
            <p style="color: #4ade80; font-weight: bold;">
              ✓ Your account can now post tweets!
            </p>
            
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
    `);
    
    // Close server after success
    setTimeout(() => {
      server.close();
      readline.close();
      console.log('You can now use your app to post tweets!\n');
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    res.send(`
      <html>
        <body style="font-family: Arial; background: #1a1a1a; color: #fff; padding: 40px; text-align: center;">
          <h1 style="color: #ff4444;">❌ Connection Failed</h1>
          <p>${error.message}</p>
          <p>Check the console for more details.</p>
        </body>
      </html>
    `);
  }
});

async function main() {
  const clientId = await question('Enter your Twitter App Client ID: ');
  
  if (!clientId || !clientId.trim()) {
    console.log('❌ Client ID is required!');
    readline.close();
    return;
  }
  
  console.log('\nInitiating OAuth 2.0 Authorization Code flow with PKCE...\n');
  
  // Generate PKCE challenge
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
  const state = base64url(crypto.randomBytes(16));
  
  pkceData = {
    codeVerifier,
    clientId: clientId.trim(),
    state
  };
  
  // Start local server
  server = app.listen(PORT, () => {
    console.log(`✓ Local callback server started on port ${PORT}`);
  });
  
  // Build authorization URL
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId.trim());
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', 'tweet.read tweet.write users.read offline.access');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  
  console.log('Opening browser for authorization...\n');
  console.log('═════════════════════════════════════════════════════════');
  console.log('Please open this URL in your browser:');
  console.log('═════════════════════════════════════════════════════════');
  console.log(authUrl.toString());
  console.log('═════════════════════════════════════════════════════════\n');
  
  console.log('Waiting for authorization...\n');
}

main().catch(err => {
  console.error('Error:', err);
  readline.close();
  process.exit(1);
});
