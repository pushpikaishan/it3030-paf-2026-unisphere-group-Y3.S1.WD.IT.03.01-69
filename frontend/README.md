# Frontend (React + Vite)

Frontend app for the Smart Campus project.

## Prerequisites

1. Node.js 20+ (LTS recommended)
2. npm 10+
3. Backend running on http://localhost:8085

## Install

```bash
npm install
```

## Run (Development)

```bash
npm run dev
```

Open: http://localhost:5173

## Available Scripts

- npm run dev: start Vite dev server
- npm run build: create production build
- npm run preview: preview production build locally
- npm run lint: run ESLint

## API Integration

- API base path in frontend code: /api
- Vite proxy forwards to backend http://localhost:8085
- Uploads path /uploads is also proxied to backend

## Important Notes

- Start backend first, then frontend.
- If API requests fail, check backend port and vite.config.js proxy settings.
- For full-stack setup details, see repository root README.md.
