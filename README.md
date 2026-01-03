# JulklApp - just test change

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/your-org/your-repo) [![License](https://img.shields.io/badge/license-MIT-green.svg)]

A modern web application to automate Secret Santa events for small groups (3–32 participants). Draw authors can register, create events, enter participant details, then participants receive accounts to view their assigned recipient alongside AI-generated gift suggestions.

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

## Project Description

JulklApp solves the hassle of organizing Secret Santa by providing:

- Secure email/password authentication for event authors and participants
- Participant management with validation (3–32 participants, letter length ≤10 000 chars)
- Fair, one-to-one matching algorithm with no self-matches
- Auto-provisioned participant accounts and first-time password setup
- Row-level security: authors see only their draws; participants see only their match
- Dedicated match page showing recipient details and gift preferences
- AI-powered gift suggestions via OpenRouter.ai (3 retry attempts, 30 s timeout)
- Indefinite caching of AI suggestions with manual refresh
- All UI strings wrapped in i18n abstraction (English UI, ready for localization)

## Tech Stack

**Frontend**

- Astro 5 – static-first pages with minimal JavaScript
- React 19 – interactive components
- TypeScript 5 – static typing and IDE support
- Tailwind CSS 4 – utility-first styling
- Shadcn/ui – accessible React component library

**Backend**

- Supabase – PostgreSQL database, SDK, and built-in authentication

**AI Integration**

- OpenRouter.ai – unified access to OpenAI, Anthropic, Google models; API key cost limits

**Testing**

- Vitest 4 – fast, ESM-native test runner with TypeScript support
- React Testing Library – user-centric component testing
- jsdom – DOM simulation for Node.js testing
- Playwright – end-to-end testing (planned for post-MVP)

**CI/CD & Hosting**

- GitHub Actions – build, lint, test pipelines
- DigitalOcean (Docker) – containerized deployment

## Getting Started Locally

### Prerequisites

- Node.js 22.14.0 (see `.nvmrc`)
- Git
- A Supabase project (URL, ANON key, and SERVICE ROLE key)
- OpenRouter API key

### Setup

```bash
# Clone the repository
git clone https://github.com/1mcodes/10x-project.git
cd your-repo

# Install dependencies
npm install

# Create a .env file in the project root with:
# SUPABASE_URL=your-supabase-url
# SUPABASE_KEY=your-supabase-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
# OPENROUTER_API_KEY=your-openrouter-api-key
# PUBLIC_SITE_URL=http://localhost:4321 (or your production URL)

# Start the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

In the project directory, run:

- **`npm run dev`**  
  Start Astro in development mode (hot-reload).

- **`npm run build`**  
  Build the production site.

- **`npm run preview`**  
  Preview the production build locally.

- **`npm run astro`**  
  Run any Astro CLI command (e.g., `npm run astro -- --help`).

- **`npm run lint`**  
  Lint all files with ESLint.

- **`npm run lint:fix`**  
  Lint and auto-fix issues.

- **`npm run format`**  
  Format code with Prettier.

- **`npm run test`**  
  Run all tests with Vitest.

- **`npm run test:watch`**  
  Run tests in watch mode for development.

- **`npm run test:coverage`**  
  Run tests and generate coverage report.

## Project Scope

### In Scope

- Email/password authentication for authors and participants
- Creation and management of Secret Santa draws (3–32 participants)
- AI-driven gift suggestions with retry logic and caching
- Row-level security policies in the database
- English UI with built-in i18n for future localization
- Comprehensive test coverage (80% minimum, 100% for core business logic)

### Out of Scope

- Email confirmation workflows
- Participant exclusion rules or complex mutual-exclusion validation
- Budget management for gifts
- Modification or deletion of draws after creation

## Project Status

The project is currenlty in the MVP stage and under active development.

## License

This project is licensed under the [MIT License](LICENSE).
