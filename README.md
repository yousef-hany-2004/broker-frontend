# broker-frontend

React + Vite frontend.

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Run in development
```bash
npm run dev
```

### 3) Build for production
```bash
npm run build
```

### 4) Preview production build
```bash
npm run preview
```

## API Base URL

The project uses:
- `vite.config.js` proxy for `"/api"` and `"/hubs"` to: `https://broker-system-api.runasp.net`
- `src/services/axiosInstance.js` which reads `import.meta.env.VITE_API_URL` (fallback = `""`).

If you deploy to an environment where you cannot rely on the Vite dev-proxy, set:
- `VITE_API_URL` (e.g. `https://broker-system-api.runasp.net`)

## Notes
- `.env` / `.env.local` are ignored by git (see `.gitignore`).

## Deploy on GitHub (push)

After committing, push to your GitHub repository.

Example:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

