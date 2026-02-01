# Running The Chewth Hub Locally

## Quick start

1. **Install dependencies**
   ```bash
   cd The-Chewth-Hub
   npm install
   ```

2. **Start the app (dev mode)**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   - Go to **http://localhost:5000**
   - One process serves both the API and the React app with Vite HMR.

## Optional: environment variables

- **`PORT`** – Server port (default: `5000`). Set if you want another port.
- **`SPORTSDATA_API_KEY`** – Optional. Scores use **ESPN** (no key needed). This key is only for standings and stats from SportsData.io. Copy `.env.example` to `.env` and add your key. Get one at [sportsdata.io](https://sportsdata.io).
- **`DATABASE_URL`** – Only needed for `npm run db:push` (migrations). The app uses in-memory storage by default, so you don’t need PostgreSQL to run locally.

## Other commands

| Command        | Description                                      |
|----------------|--------------------------------------------------|
| `npm run dev`  | Start server + Vite dev (API + client on :5000)  |
| `npm run build`| Production build → `dist/`                       |
| `npm run start`| Run production build (after `npm run build`)     |
| `npm run check`| TypeScript check                                 |
| `npm run db:push` | Push schema to PostgreSQL (needs `DATABASE_URL`) |

## Testing the app

- **Home** – http://localhost:5000  
- **Podcast** – http://localhost:5000/podcast  
- **News** – http://localhost:5000/news  
- **Scores** – http://localhost:5000/scores  
- Sport hubs (e.g. NFL) – use the nav; e.g. http://localhost:5000/nfl  

Scores load from ESPN (no API key required). With `SPORTSDATA_API_KEY` set in `.env`, standings and stats from SportsData.io will also work.
