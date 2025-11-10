# YTAssist

A personal lightweight React application designed to manage YouTube channel content and analysis.

## Features

- **Content Pipeline Management**: Track content through different stages from idea to publication
- **Task Management**: Daily task tracking with automatic expiration
- **Analytics Dashboard**: Overview of content pipeline status and metrics
- **Automated Analysis**: System-generated tasks for feedback analysis
- **Mobile-First Design**: Optimized for low-end mobile devices
- **Dependency Management**: Control publication order with content dependencies

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite with Rolldown (experimental)
- **Styling**: Custom CSS with mobile-first responsive design
- **Routing**: React Router DOM
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Authentication**: Password-based with localStorage caching

## Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Reusable UI components
│   ├── content/        # Content management components
│   ├── tasks/          # Task management components
│   ├── dashboard/      # Dashboard components
│   └── morals/         # Morals display components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── constants/          # Application constants
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_PASSWORD=your_app_password
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Content Pipeline Stages

The application manages content through these stages:

1. **Pending** - Initial idea stage
2. **Title** - Title created (requires title field)
3. **Thumbnail** - Thumbnail designed
4. **ToC** - Table of Contents planned
5. **Ordered** - Content structure organized
6. **Scripted** - Script written (requires script field)
7. **Recorded** - Video recorded
8. **Voice Edited** - Audio editing completed
9. **Edited** - Video editing completed
10. **Revised** - Content reviewed and revised
11. **SEO Optimised** - SEO optimization completed
12. **Published** - Content published (requires link field)

## Task Management

- **User Tasks**: Manually created tasks for daily workflow
- **System Tasks**: Automatically generated tasks for feedback analysis
- **Expiration**: Tasks automatically expire at midnight (00:00)
- **Completion**: Completed tasks are automatically deleted

## Database Schema

The application uses three main tables:

- **contents**: Stores content information and pipeline status
- **tasks**: Stores user and system-generated tasks
- **settings**: Stores application configuration

## Contributing

This is a personal project, but suggestions and improvements are welcome.

## License

Private project - All rights reserved.