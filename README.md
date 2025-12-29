# Gmail Automation

A modern web app to view and manage emails from multiple Gmail accounts in a unified inbox. Built with React, TypeScript, and Firebase authentication.

## Features

- **Google Sign-In** with OAuth2 (Firebase Auth)
- **Connect multiple Gmail accounts** and view all emails in one place
- **Unified inbox**: See emails from all connected accounts together
- **View sender and receiver** for each email
- **Batch fetching** to avoid Gmail API rate limits (no 429 errors)
- **Inbox statistics** (total and unread counts)
- **Responsive UI** with reusable card components

## Tech Stack

- React + TypeScript
- Vite
- Firebase Auth (Google provider)
- Gmail REST API
- Tailwind CSS (for styling)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/nikhil-agrawal123/gmail-automation.git
cd gmail-automation
```

### 2. Install dependencies

```bash
npm install
```
or
```bash
bun install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your Firebase and Gmail API credentials:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Set up Google Cloud & Gmail API

- Create a project in [Google Cloud Console](https://console.cloud.google.com/)
- Enable the Gmail API
- Set up OAuth2 credentials and add your app's domain to the authorized origins
- Add the OAuth2 client ID to your Firebase project

### 5. Run the app

```bash
npm run dev
```
or 
```bash
bun run dev
```


Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

- Click "Sign in with Google" to connect your first Gmail account.
- Use "Add another account" to connect more Gmail accounts.
- All emails from connected accounts appear in the unified inbox.
- Each email card shows sender, receiver, subject, and preview.
- Use the sidebar to filter by account or view all emails together.

## Project Structure

```
src/
  components/      # UI components (cards, inbox, etc.)
  contexts/        # React contexts for auth and email state
  hooks/           # Custom React hooks
  interface/       # TypeScript interfaces for Gmail data
  lib/             # API utilities (gmail.ts, firebase.ts)
  pages/           # App pages (Inbox, etc.)
  App.tsx          # Main app component
```

## Notes

- The app fetches emails in batches (default 10 per batch) with a delay to avoid Gmail API rate limits.
- Only emails from the inbox are shown by default.
- Make sure your Google Cloud OAuth consent screen is published for multi-account support.

## License

MIT

---