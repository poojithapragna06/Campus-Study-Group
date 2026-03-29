# StudySync - Campus Study Group & Collaboration Platform

A full-featured React + TypeScript + Tailwind CSS frontend for managing campus study groups.

## Features

### Student Features
- **Dashboard** - Overview of groups, sessions, recent chat activity & stats
- **Study Groups** - Browse, search, filter, create and join study groups
- **Group Chat** - Real-time-style messaging with file sharing per group
- **Sessions** - Schedule, RSVP, and track study sessions
- **Shared Files** - Upload (drag & drop), browse, and download group files

### Admin Features
- **Admin Dashboard** - Platform stats, activity overview, system health
- **Group Management** - Archive or delete groups
- **User Management** - View, ban, or remove users
- **Content Review** - Approve or remove flagged messages

## Tech Stack
- React 18 + TypeScript
- Tailwind CSS (v3)
- Lucide React (icons)
- date-fns (date formatting)

## Getting Started

```bash
# Install dependencies
npm install

# Rebuild Tailwind CSS
npx tailwindcss -i ./src/index.css -o ./src/tailwind-output.css

# Start development server
npm start

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── Dashboard.tsx      # Main dashboard view
│   ├── StudyGroups.tsx    # Groups list + create modal
│   ├── Chat.tsx           # Group chat interface
│   ├── Sessions.tsx       # Session scheduling
│   ├── SharedFiles.tsx    # File management
│   └── AdminPanel.tsx     # Admin dashboard
├── data/
│   └── mockData.ts        # Sample data
├── types/
│   └── index.ts           # TypeScript interfaces
├── App.tsx
└── index.tsx
```

## Demo Credentials
- **Student View**: Default on load (Aryan Sharma, CS Year 3)
- **Admin View**: Click "Switch to Admin View" in the sidebar

## Design
Dark editorial aesthetic with amber (#FFB800) and teal (#00D4AA) accents.
Fonts: Playfair Display (display) + DM Sans (body) + JetBrains Mono (code)
