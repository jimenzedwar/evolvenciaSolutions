# CozyCommerce Starter

This repository bootstraps a Vite + React + TypeScript playground for experimenting with the CozyCommerce demo look and feel. Supabase, React Router, and Tailwind CSS are prewired so you can begin stitching together product, cart, and auth experiences immediately.

## Prerequisites

- Node.js 20+ (the project was created with Node 22)
- npm 10+
- A Supabase project with access to the project URL and anon key

## Environment variables

Copy `.env.example` to `.env.local` (or `.env`) and provide your Supabase credentials:

```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

These variables are consumed by `src/supabaseClient.ts` to configure the client SDK.

## Getting started

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

By default the app runs at [http://localhost:5173](http://localhost:5173). The CozyCommerce-inspired landing page demonstrates Tailwind theming and React Router navigation.

## Available scripts

- `npm run dev` – start Vite in development mode with hot module replacement.
- `npm run build` – type-check the project and create an optimized production build in `dist/`.
- `npm run preview` – preview the production build locally after running `npm run build`.

## Project structure

```
.
├── index.html
├── package.json
├── public/
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── supabaseClient.ts
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.node.json
```

Use the `supabase` instance exported from `src/supabaseClient.ts` inside your React components or data loaders to interact with your backend.
