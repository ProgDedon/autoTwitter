# Twitter Posting Fix

## The Problem
Your account in `accounts.json` has an **OAuth 2.0 Application-Only** token (Client Credentials), but Twitter requires **OAuth 2.0 User Context** tokens to post tweets.

### How to tell:
- ❌ No `encryptedRefreshToken` field in the account
- ❌ Error: "Authenticating with OAuth 2.0 Application-Only is forbidden"
- ✅ Needs: OAuth 2.0 Authorization Code flow with PKCE (User Context)

## The Solution

You need to reconnect your account using the **OAuth 2.0 Authorization Code flow with PKCE**. This will give you a User Context token with write permissions.

### Step 1: Verify Twitter App Permissions

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your App
3. Go to **"User authentication settings"**
4. Ensure these settings:
   - **App permissions**: Select **"Read and write"** (NOT Read-only)
   - **Type of App**: **"Web App"**
   - **Callback URL**: `http://localhost:3001/oauth2-callback`
   - **Website URL**: `http://localhost:3001`
5. Click **"Save"** - this may regenerate your Client ID

### Step 2: Get Your OAuth 2.0 Client Credentials

From your Twitter App settings:
- Copy your **Client ID** (starts with something like "VGhpc...")
- Copy your **Client Secret** (starts with something like "...")

### Step 3: Use the Built-in OAuth2 Flow

I'll create a helper script to connect your account properly.

## Quick Fix Script

Run the script below to initiate a proper OAuth2 connection.

