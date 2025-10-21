# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an **Adaptive Educational Coach** application - a React-based web platform that provides AI-powered personalized learning experiences for students and classroom management tools for teachers. The application uses Supabase as its backend and features adaptive learning paths, doubt resolution, progress tracking, and comprehensive educational content management.

## Development Commands

### Core Development
```powershell
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Testing
```powershell
# Run Playwright tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui

# Run specific test
npx playwright test src/tests/specific-test.spec.ts
```

### Database Management
```powershell
# Start Supabase local development (if configured)
supabase start

# Generate TypeScript types from database
supabase gen types typescript --local > src/types/database.ts

# Reset local database
supabase db reset

# Apply migrations
supabase db push
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite with SWC
- **UI Framework**: shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: React Context + TanStack Query
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **Testing**: Playwright for E2E testing
- **AI Integration**: DeepSeek API (configurable to Ollama)

### Key Application Domains

#### 1. User Management & Authentication
- Role-based access (Student, Teacher, Admin)
- Profile management with learning preferences
- Onboarding flow for new users
- Session persistence and auto-refresh

#### 2. Adaptive Learning System
- **Learning Style Assessment**: Visual, Auditory, Kinesthetic, Reading/Writing
- **Personalized Content Delivery**: Content adapted based on learning styles
- **Progress Tracking**: Comprehensive analytics and performance metrics
- **AI Coaching**: Context-aware coaching with multiple modes (quick feedback, detailed insights, progress analysis)

#### 3. Classroom Management
- Classroom creation and management for teachers
- Student enrollment via join codes
- Assignment distribution and tracking
- Real-time progress monitoring

#### 4. Content Management
- Multi-format content support (text, video, interactive)
- YouTube integration for educational content
- OCR capabilities for document processing
- Essay checking and automated feedback

#### 5. AI-Powered Features
- **Doubt Resolution**: AI-powered question answering system
- **Content Summarization**: Automatic key point extraction
- **Quiz Generation**: AI-generated assessments
- **Personalized Recommendations**: Adaptive content suggestions

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication-related components
│   ├── learning-style/ # Learning style assessment components
│   ├── ui/             # shadcn/ui base components
│   └── ...
├── context/            # React context providers
│   ├── AppContext.tsx  # Main application state
│   └── LearningStyleContext.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication logic
│   ├── useClassroom.ts # Classroom management
│   └── ...
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client configuration
│   ├── ai-agent.ts     # AI integration logic
│   └── utils.ts        # General utilities
├── pages/              # Route components
├── types/              # TypeScript type definitions
└── data/               # Static data and templates

supabase/
├── functions/          # Edge Functions
└── migrations/         # Database migrations
```

### State Management Architecture

The app uses a hybrid approach:
- **Global State**: React Context (`AppContext`) for user authentication, classrooms, and global app state
- **Server State**: TanStack Query for API calls and caching
- **Local State**: React hooks for component-specific state

### Database Schema (Key Tables)

- `profiles`: User profiles with learning preferences
- `classrooms`: Classroom information and management
- `assignments`: Assignment tracking and submissions
- `content`: Educational content and metadata
- `progress_tracking`: Student performance analytics
- `learning_paths`: Personalized learning sequences
- `doubts`: Student questions and AI responses

## AI Configuration

The application supports two AI providers:

### DeepSeek (Recommended)
- Cost-effective API-based solution
- Configure `DEEPSEEK_API_KEY` in Supabase Edge Function secrets
- See `AI_SETUP.md` for detailed setup instructions

### Ollama (Self-hosted)
- Free, local AI models
- Requires server setup and model downloads
- Configure `OLLAMA_URL` environment variable

## Development Guidelines

### Component Patterns
- Use functional components with hooks
- Implement error boundaries for robustness
- Lazy load route components for performance
- Follow shadcn/ui patterns for consistent UI

### Data Fetching
- Use TanStack Query for server state management
- Implement proper error handling and loading states
- Cache frequently accessed data appropriately
- Use Supabase real-time subscriptions for live updates

### Authentication Flow
- All protected routes use `ProtectedRoute` wrapper
- Role-based access control (student/teacher/admin)
- Session persistence across browser restarts
- Automatic token refresh handling

### Testing Strategy
- Playwright for end-to-end testing
- Test critical user flows (auth, onboarding, core features)
- Mock external dependencies in tests
- Run tests in CI/CD pipeline

### Performance Considerations
- Code splitting implemented via lazy loading and manual chunks
- Image optimization for educational content
- Database query optimization with proper indexing
- Edge function caching for AI responses

## Common Development Patterns

### Adding New Features
1. Define TypeScript types in `src/types/`
2. Create database migrations if needed
3. Implement API logic in Edge Functions
4. Create React hooks for state management
5. Build UI components following shadcn/ui patterns
6. Add proper error handling and loading states
7. Write tests for critical paths

### Working with Supabase
- Use Row Level Security (RLS) policies for data access
- Implement real-time subscriptions for collaborative features
- Handle Supabase client errors gracefully
- Use Edge Functions for server-side AI processing

### AI Integration Best Practices
- Cache AI responses to reduce costs and improve performance
- Implement fallback mechanisms for API failures
- Use appropriate context window sizes for AI prompts
- Monitor AI usage and costs through logging

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `DEEPSEEK_API_KEY`: (Edge Function) DeepSeek AI API key
- `YOUTUBE_API_KEY`: (Edge Function) YouTube Data API key

## Build & Deployment

The application is configured for deployment on platforms like Vercel, Netlify, or similar:
- Build output optimized with code splitting
- Environment variables configured for production
- Static assets properly handled
- Proper error boundaries for production stability