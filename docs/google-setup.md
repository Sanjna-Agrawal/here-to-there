# Set up the Gmail scan

You need your own Google OAuth client ID. It's free and takes about 10 minutes.

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a project (e.g. "Here to There").
2. **APIs & Services → Library**: search for **Gmail API** and click **Enable**.
3. **APIs & Services → OAuth consent screen** (also called **Google Auth Platform**):
   - User type: **External**
   - App name, support email, and developer email: your own
   - Scopes: add `https://www.googleapis.com/auth/gmail.readonly`
   - Audience / Test users: add your own Gmail address (and anyone else who will use your copy)
   - Leave the publishing status as **Testing**
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173`, plus your deployed URL if you have one
   - No redirect URI is needed
5. Copy the **Client ID** into `.env.local`:

```
VITE_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

6. Restart `npm run dev`, go to the **Accounts** tab, and click **Connect Gmail**.

Google will show an "unverified app" warning because this is your own unreviewed project. That's expected for personal use: click **Continue**.

## What the scan reads

- Search 1: emails from the last 5 years that contain your old street line or ZIP code.
- Search 2: receipts, statements, and billing emails from the last 3 years.
- For each match, only the `From` and `Date` headers are read. Senders are grouped by company domain, and personal email addresses (gmail.com, yahoo.com, etc.) are ignored.
