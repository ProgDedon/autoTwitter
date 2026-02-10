const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch');

const STORE_KEY = process.env.ACCOUNT_STORE_KEY || 'dev-key-change-in-production-32b';

// Decrypt sensitive data
function decrypt(encrypted) {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  const key = crypto.createHash('sha256').update(STORE_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Verify account with OAuth 2.0 Bearer Token
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

// Post tweet using OAuth 2.0
async function postTweetWithOAuth2(token, text) {
  const url = 'https://api.twitter.com/2/tweets';
  const body = { text };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tweet post failed: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

// Main test
async function testTwitterAccount() {
  try {
    console.log('📋 Reading accounts.json...');
    const data = fs.readFileSync('./server/accounts.json', 'utf8');
    const store = JSON.parse(data);
    
    if (!store.accounts || store.accounts.length === 0) {
      console.error('❌ No accounts found in accounts.json');
      return;
    }
    
    const account = store.accounts[0];
    console.log(`\n👤 Testing account: @${account.username} (${account.name})`);
    console.log(`   Auth Type: ${account.authType}`);
    console.log(`   Verified: ${account.verified}`);
    console.log(`   Expires At: ${account.expiresAt}`);
    
    // Check if token is expired
    const expiresAt = new Date(account.expiresAt);
    const now = new Date();
    if (expiresAt < now) {
      console.error(`\n❌ Token is EXPIRED (expired ${Math.round((now - expiresAt) / 1000 / 60)} minutes ago)`);
      console.log('\n🔧 To fix this:');
      console.log('   1. The account needs to be reconnected with fresh credentials');
      console.log('   2. Use the OAuth2 flow to get a new access token');
      return;
    } else {
      console.log(`   ✓ Token is valid (expires in ${Math.round((expiresAt - now) / 1000 / 60)} minutes)`);
    }
    
    // Decrypt access token
    console.log('\n🔐 Decrypting access token...');
    const accessToken = decrypt(account.encryptedAccessToken);
    console.log(`   ✓ Access token decrypted (length: ${accessToken.length})`);
    
    // Test 1: Verify credentials
    console.log('\n🔍 Test 1: Verifying credentials with Twitter API...');
    try {
      const userInfo = await verifyWithOAuth2(accessToken);
      console.log(`   ✅ SUCCESS! Account verified:`);
      console.log(`      ID: ${userInfo.id}`);
      console.log(`      Username: @${userInfo.username}`);
      console.log(`      Name: ${userInfo.name}`);
    } catch (error) {
      console.error(`   ❌ FAILED: ${error.message}`);
      console.log('\n🔧 Troubleshooting:');
      console.log('   - Check if the access token is correct');
      console.log('   - Verify Twitter API app has proper permissions');
      console.log('   - Ensure the app has "Read and write" permissions');
      console.log('   - Token may be expired or revoked');
      return;
    }
    
    // Test 2: Try to post a test tweet
    console.log('\n📝 Test 2: Attempting to post a test tweet...');
    const testMessage = `Test tweet from my app - ${new Date().toLocaleString()} 🚀`;
    console.log(`   Message: "${testMessage}"`);
    
    try {
      const result = await postTweetWithOAuth2(accessToken, testMessage);
      console.log(`   ✅ SUCCESS! Tweet posted:`);
      console.log(`      Tweet ID: ${result.data.id}`);
      console.log(`      Text: ${result.data.text}`);
      console.log(`      URL: https://twitter.com/${account.username}/status/${result.data.id}`);
    } catch (error) {
      console.error(`   ❌ FAILED: ${error.message}`);
      console.log('\n🔧 Common issues:');
      console.log('   1. App permissions: Must have "Read and write" enabled');
      console.log('   2. OAuth 2.0 scopes: Must include "tweet.write"');
      console.log('   3. User consent: User must authorize with write permissions');
      console.log('   4. Rate limits: Check if API rate limits are exceeded');
      
      // Parse error for more details
      if (error.message.includes('403')) {
        console.log('\n⚠️  403 Error typically means:');
        console.log('   - Your app lacks write permissions');
        console.log('   - Go to Twitter Developer Portal → Your App → Settings');
        console.log('   - Under "User authentication settings" → Enable "Read and write"');
        console.log('   - Regenerate your access tokens after changing permissions');
      } else if (error.message.includes('401')) {
        console.log('\n⚠️  401 Error typically means:');
        console.log('   - Invalid or expired access token');
        console.log('   - Token was revoked by user');
        console.log('   - Need to reconnect the account');
      }
      return;
    }
    
    console.log('\n✅ All tests passed! The account can successfully interact with Twitter.');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testTwitterAccount();
