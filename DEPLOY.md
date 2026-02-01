# Deploy to Firebase (Hosting + API)

This app uses **Firebase Hosting** for the static site and **Cloud Run** for the API (`/api/**`). Deploy both for a full production update.

## Prerequisites

- **Firebase CLI**: `npm install -g firebase-tools` (or use project devDep: `npx firebase`)
- **Google Cloud CLI** (for API): [Install gcloud](https://cloud.google.com/sdk/docs/install)
- Log in: `firebase login` and `gcloud auth login`
- Project: `.firebaserc` uses project **the-chewth**

## 1. Build for production

```bash
npm run build
```

- Builds client (Vite) → `dist/public/`
- Builds server (esbuild) → `dist/index.cjs`

## 2. Deploy API (Cloud Run)

The API is the Cloud Run service **chewth-api** in **us-central1**. Deploy it so `/api/**` stays live:

```bash
npm run deploy:api
```

Or manually:

```bash
gcloud run deploy chewth-api --source . --region us-central1 --allow-unauthenticated
```

- Uses the repo `Dockerfile` (builds app inside the image, runs `node dist/index.cjs`).
- Set env vars (e.g. `SPORTSDATA_API_KEY`) in Cloud Run console or with `--set-env-vars`.
- If the build fails, check [Cloud Build logs](https://console.cloud.google.com/cloud-build/builds?project=the-chewth) for the exact error.

## 3. Deploy Hosting (Firebase)

Serves the static site from `dist/public` and rewrites `/api/**` to the Cloud Run service above:

```bash
npm run deploy:hosting
```

Or:

```bash
firebase deploy --only hosting
```

## Deploy everything (build + hosting + API)

1. Build once:
   ```bash
   npm run build
   ```
2. Deploy API (Cloud Run):
   ```bash
   npm run deploy:api
   ```
3. Deploy Hosting (Firebase):
   ```bash
   npm run deploy:hosting
   ```

Or use the combined deploy script (build + Firebase deploy; API must be deployed separately when you change the backend):

```bash
npm run deploy
```

This runs `npm run build` then `firebase deploy` (hosting only). Deploy the API with `npm run deploy:api` whenever you change server code or env.

## Summary

| Target        | Command              | What it does                          |
|---------------|----------------------|----------------------------------------|
| Build         | `npm run build`      | Client + server → `dist/`              |
| Hosting only  | `npm run deploy:hosting` | Static site to Firebase Hosting   |
| API only      | `npm run deploy:api` | Node server to Cloud Run (chewth-api)  |
| Build + Hosting | `npm run deploy`   | Build then `firebase deploy` (hosting) |
