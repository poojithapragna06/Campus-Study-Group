# StudySync — Campus Study Group & Collaboration Platform

React + TypeScript + Tailwind CSS + TanStack Query v5

---

## Quick Start

```bash
npm install
npm start        # → http://localhost:3000
```

> `tailwind-output.css` is pre-built and included. Only re-run the command below if you add new Tailwind classes:
> ```bash
> npx tailwindcss -i ./src/index.css -o ./src/tailwind-output.css --watch
> ```

---

## Features

| View | What it does |
|---|---|
| **Dashboard** | Stats (TanStack Query), upcoming sessions, recent chat — all with skeleton loaders |
| **Study Groups** | Browse / search / filter groups; create via modal with mutation + error state |
| **Group Chat** | Per-group chat with 5s polling, optimistic message append, file pill display |
| **Sessions** | Schedule sessions, RSVP toggle with pending state, past/upcoming split |
| **Shared Files** | Drag-&-drop upload mutation, delete with fade-out, per-group filter |
| **Admin Panel** | Platform stats, group archive/delete, user management, flagged content review |

Switch between **Student** and **Admin** views using the button at the bottom of the sidebar.

---

## Tech Stack

| Package | Version | Notes |
|---|---|---|
| react | 19 | |
| typescript | **5** | Upgraded from 4.9 |
| @tanstack/react-query | **5** | Queries, mutations, devtools |
| tailwindcss | 3 | Pre-built output included |
| lucide-react | 1 | Icons |
| date-fns | 4 | Date formatting |
| web-vitals | **4** | Upgraded; uses new `onINP` API |

---

## Architecture

```
src/
├── api/
│   └── index.ts          # Async API layer (swap for real fetch/axios)
├── hooks/
│   └── useQueries.ts     # All TanStack Query hooks + typed query keys (QK)
├── components/
│   ├── ui.tsx            # Skeleton, LoadingGrid, ErrorState, MutationButton
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx     # useDashboardStats, useGroups, useSessions, useMessages
│   ├── StudyGroups.tsx   # useGroups + useCreateGroup mutation
│   ├── Chat.tsx          # useMessages (5s poll) + useSendMessage mutation
│   ├── Sessions.tsx      # useSessions + useCreateSession + useRsvpSession
│   ├── SharedFiles.tsx   # useFiles + useUploadFile + useDeleteFile
│   └── AdminPanel.tsx    # useGroups + useUsers + archive/delete mutations
├── data/
│   └── mockData.ts       # In-memory mock store (mutated by api/index.ts)
├── types/
│   └── index.ts
└── App.tsx               # QueryClientProvider + ReactQueryDevtools (dev only)
```

### Replacing mock API with real endpoints

Every function in `src/api/index.ts` has a matching signature. Swap the body of each function with a `fetch` / `axios` call to your backend — the hooks and UI stay unchanged.

---

## QueryClient Config

```ts
defaultOptions: {
  queries:   { retry: 2, staleTime: 30s, gcTime: 5min, refetchOnWindowFocus: false },
  mutations: { retry: 1 }
}
```

**ReactQueryDevtools** panel appears in the bottom-right corner during `npm start` (dev mode only).
