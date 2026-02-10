# Quick Start: Reply Feature

## How It Works

Generate unique comments for multiple Twitter accounts and post them as replies to a specific tweet - each comment posts only once per account.

## Step-by-Step Usage

### 1. **Setup Accounts**
   - Click "Settings" tab
   - Add Twitter accounts (OAuth1 or Bearer Token)
   - Verify each account is authenticated

### 2. **Enter Tweet Details**
   - In the "Setup" tab, enter a Twitter URL or tweet ID
   - Example formats accepted:
     - `https://twitter.com/username/status/1234567890`
     - `https://x.com/username/status/1234567890`
     - Just the ID: `1234567890`

### 3. **Write Instructions**
   - Enter instructions for the AI (e.g., "Be enthusiastic", "Provide technical insight")
   - AI will generate unique comments for each account following your guidance

### 4. **Generate Comments**
   - Click "Generate for Accounts" button
   - Wait for AI to create unique comments for each account

### 5. **Review Comments**
   - Check each generated comment
   - Comments show character count (max 280)
   - Use "Copy" button to copy individual comments

### 6. **Post Comments**
   - **Individual:** Click "Post Tweet" button on specific comment
   - **Batch:** Click "Post All to Twitter" to post all at once
   - Comments are posted as **replies** to the tweet you specified
   - Once posted successfully, button is disabled (can't post twice)

## Features

✅ **AI-Generated:** Unique comment per account (no copy-paste duplicates)
✅ **Reply Support:** Posts as replies, not standalone tweets
✅ **Post Once:** Prevents accidental duplicate posting
✅ **Batch Processing:** Post all comments sequentially
✅ **Visual Feedback:** See posting status and errors in real-time
✅ **Multiple Auth:** Works with OAuth1 and Bearer Token auth

## Example Workflow

1. Add 3 accounts (@account1, @account2, @account3)
2. Enter tweet ID: `1234567890`
3. Enter instruction: "Write a thoughtful response promoting tech adoption"
4. AI generates 3 **different** comments
5. Each comment posts as a **reply** to tweet `1234567890`
6. Each account can only post their comment **once**

## Troubleshooting

**Comments not posting?**
- Check server is running: `npm run server`
- Verify accounts are authenticated (green checkmark)
- Check browser console for error messages

**"Already Posted" status stays?**
- This is per-session in the browser
- Refresh page to reset status (will allow re-posting)
- In production, implement backend post-history for permanent tracking

**Wrong tweet ID extracted?**
- Manually enter just the numeric ID instead of URL
- Example: Instead of full URL, use `1234567890`

**Comments too similar?**
- Rewrite user instruction to be more specific
- Click "Regenerate Comments" to try again
- Instruction examples:
  - "Focus on business implications"
  - "Provide a code example"
  - "Ask a clarifying question"

## Backend API

**POST /api/post**

Request body:
```json
{
  "accountId": "account-id",
  "text": "comment text here",
  "in_reply_to_tweet_id": "tweet-id-here"
}
```

Response (success):
```json
{
  "message": "Tweet posted successfully",
  "tweet": { "data": { "id": "posted-tweet-id", "text": "..." } }
}
```

Response (error):
```json
{
  "error": "error message describing what went wrong"
}
```

## Technical Notes

- Comments are authenticated using stored account credentials
- Twitter API v2 endpoint: `/tweets`
- Reply specified via `reply: { in_reply_to_tweet_id }` in request
- Character limit enforced by Twitter (280 chars)
- Server-side posting recommended (avoids CORS issues)
