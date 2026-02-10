# OAuth 1.0a Setup Guide

This application now exclusively uses **OAuth 1.0a** for Twitter authentication with full account verification and posting capabilities.

## Getting Your OAuth 1.0a Credentials

### Step 1: Go to Twitter Developer Portal
1. Visit [https://developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter account

### Step 2: Create an Application
1. Click "Create app" under "Standalone Apps"
2. Fill in the app name, description, and use case
3. Complete the developer agreement and submit

### Step 3: Generate OAuth 1.0a Credentials
1. In your app settings, go to the **Authentication tokens & keys** section
2. Under **OAuth 1.0a Settings**, set:
   - **App type**: Web App
   - **Callback URI**: `http://localhost:3001/oauth1-callback`
   - **Website URL**: `http://localhost:3001`
   - **Terms of Service URL**: (optional)
   - **Privacy Policy URL**: (optional)

3. Click "Generate" to create:
   - **API Key** (Consumer Key)
   - **API Secret Key** (Consumer Secret)
   - **Access Token**
   - **Access Token Secret**

### Step 4: Set Permissions
1. Go to **User authentication settings**
2. Set **App permissions** to:
   - ✓ Read
   - ✓ Write
   - ✓ Direct Messages (if needed)

## Adding an Account to the App

### Method 1: OAuth 1.0a Flow (Easiest)
1. Open the app at `http://localhost:3001`
2. Go to "Manage Accounts"
3. Scroll to "Add New Account"
4. Click **"Connect via OAuth 1.0a"**
5. Enter your Consumer Key and Consumer Secret when prompted
6. Authorize the app in the Twitter window that opens
7. Account is automatically added and verified!

### Method 2: Manual Token Entry
1. Go to "Manage Accounts" → "Add New Account"
2. Provide your:
   - **Username**: Your Twitter handle (without @)
   - **Consumer Key**: From Twitter Developer Portal
   - **Consumer Secret**: From Twitter Developer Portal
   - **Access Token**: From Twitter Developer Portal
   - **Access Token Secret**: From Twitter Developer Portal
3. Click "Add Account"
4. Account is immediately verified and ready to post!

## Testing Account Verification

### Via API
```bash
# Add account with OAuth 1.0a credentials
curl -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "consumerKey": "your_consumer_key",
    "consumerSecret": "your_consumer_secret",
    "accessToken": "your_access_token",
    "accessTokenSecret": "your_access_token_secret"
  }'
```

## Testing Tweet Posting

### Requirements
- Account must be verified
- Account must have OAuth 1.0a credentials stored
- Twitter app must have "Write" permissions enabled

### Via UI
1. Go to Dashboard
2. Select a verified account
3. Write your tweet
4. Click "Post"

### Via API
```bash
# Post a tweet from an account
curl -X POST http://localhost:3001/api/post \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account_id_from_twitter",
    "text": "Hello, Twitter!"
  }'

# Post a reply to another tweet
curl -X POST http://localhost:3001/api/post \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account_id_from_twitter",
    "text": "Great tweet!",
    "in_reply_to_tweet_id": "1234567890"
  }'
```

## Troubleshooting

### "Account verification failed"
- Check that your Consumer Key and Consumer Secret are correct
- Verify your app has "Write" permissions enabled
- Ensure access tokens haven't been revoked

### "Tweet post failed"
- Account may not be verified. Run verification first.
- Access tokens may have been revoked. Reconnect the account.
- Tweet may exceed 280 characters

### Credentials Not Working
1. Go to Twitter Developer Portal
2. Regenerate tokens if needed
3. Ensure IP/location restrictions aren't blocking the request
4. Check that your app has the correct callback URL set

## Server Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/oauth1/connect` | Initiate OAuth 1.0a flow |
| GET | `/oauth1-callback` | OAuth callback handler |
| POST | `/api/accounts` | Add account (with auto-verification) |
| GET | `/api/accounts/public` | List verified accounts |
| POST | `/api/accounts/:id/verify-public` | Manually verify account |
| POST | `/api/post` | Post tweet from account |

## Security Notes

- OAuth 1.0a credentials are encrypted using AES-256-GCM
- Consumer Secret and Access Token Secret are never stored in plaintext
- Set `ACCOUNT_STORE_KEY` environment variable in production (32+ bytes)
- Default key is for development only

## Next Steps

1. ✅ Server is configured for OAuth 1.0a
2. ✅ Account verification is enabled
3. ✅ Tweet posting is ready
4. Start adding your Twitter accounts!
