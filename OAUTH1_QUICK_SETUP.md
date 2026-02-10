# How to Add OAuth1 Account & Enable Posting

## Quick Start (5 minutes)

### Step 1: Get Your Twitter Credentials

Visit: https://developer.twitter.com/en/portal/dashboard

You need these 4 values:
1. **Consumer Key** (API Key)
2. **Consumer Secret** (API Secret)  
3. **Access Token**
4. **Access Token Secret**

### Step 2: Add Account via Web Form

1. **Start the app:**
   ```bash
   npm start
   ```
   Opens at `http://localhost:3000`

2. **Click "+ Add Account"** at the top right

3. **Fill in the form:**
   ```
   Username: your_twitter_handle (without @)
   Display Name: Your Real Name
   
   OAuth 1.0a Credentials:
   - Consumer Key: [paste from developer.twitter.com]
   - Consumer Secret: [paste from developer.twitter.com]
   - Access Token: [paste from developer.twitter.com]
   - Access Token Secret: [paste from developer.twitter.com]
   ```

4. **✅ Check the box:** "Mark account as verified"

5. **Click "Add Account"**

### Step 3: Test Posting

1. Go back to dashboard
2. Paste a tweet URL: `https://twitter.com/someone/status/1234567890`
3. Enter instruction: `"Reply with enthusiasm"`
4. Click "Generate Comments" (AI creates replies)
5. Click "Post All to Twitter" 🚀

Your comments will now post successfully!

---

## Alternative: Manual Configuration

If you prefer to edit directly:

### Edit `server/accounts.json`

```json
{
  "accounts": [
    {
      "id": "your_real_twitter_id",
      "username": "your_handle",
      "name": "Your Display Name",
      "authType": "oauth1",
      "verified": true,
      "addedAt": "2026-02-09T10:00:00.000Z",
      "encryptedAccessToken": "encrypted_value_here",
      "encryptedAccessSecret": "encrypted_value_here",
      "encryptedConsumerKey": "encrypted_value_here",
      "encryptedConsumerSecret": "encrypted_value_here"
    }
  ]
}
```

### Encrypt Your Credentials

In Node.js terminal:
```javascript
const crypto = require('crypto');
const STORE_KEY = 'dev-key-change-in-production-32b';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(STORE_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// Encrypt each credential
console.log(encrypt('your_access_token'));
console.log(encrypt('your_access_secret'));
console.log(encrypt('your_consumer_key'));
console.log(encrypt('your_consumer_secret'));
```

Replace the values in `accounts.json` with the encrypted output.

---

## Troubleshooting

### "Account not verified"
- Make sure you checked "Mark account as verified" before clicking Add Account

### "Posted but not appearing on Twitter"  
- Check that account is verified (green checkmark in account list)
- Verify your credentials are correct
- Ensure the target tweet exists

### "401 Unauthorized"
- Your OAuth1 credentials are wrong
- Double-check Consumer Key/Secret and Access Token/Secret
- Make sure tokens are still active on developer.twitter.com

---

## What Happens Behind the Scenes

```
You submit form with OAuth1 credentials
                 ↓
Server encrypts all 4 credentials (AES-256-GCM)
                 ↓
Stores encrypted data in accounts.json
                 ↓
Marks account as verified ✅
                 ↓
Ready to post! When you click "Post All to Twitter":
                 ↓
Server decrypts credentials
                 ↓
Uses OAuth1 to sign API request to Twitter
                 ↓
Posts your comment! 🚀
```

---

## Key Features

✅ **Secure**: OAuth1 credentials encrypted with AES-256-GCM  
✅ **Simple**: Just fill a form, no complex setup  
✅ **Verified**: Mark accounts as ready to post immediately  
✅ **Multiple**: Add as many accounts as you want  
✅ **Instant**: "Post All" posts from all verified accounts  

---

## Support

Need help? Check the full documentation:
- [OAUTH1_SETUP_COMPLETE.md](OAUTH1_SETUP_COMPLETE.md)
- [TWITTER_POST_ALL_FIX.md](TWITTER_POST_ALL_FIX.md)
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
