# World Cup 2026 Predictor

A focused web app for running a World Cup 2026 prediction league.

## Live Demo
- https://predictionfootballapp.netlify.app/

## Current App Scope
This repository is now intentionally scoped to:
- **Authentication**: Login, Signup, Profile, Settings
- **Prediction App**: Dashboard, Matches, Leaderboard, Rooms, Rules, Prediction Admin
- **Platform Admin**: Admin Dashboard, Users, Content
- **Shared Shell UI**: Sidebar, top navigation, dark mode toggle

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, storage)

## Getting Started
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
```

## Notes
- Legacy non-prediction app modules were removed to keep the codebase focused and maintainable.
- If you are deploying to Netlify, ensure SPA redirect handling is configured (already supported in `public/_redirects`).
