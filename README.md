# TriggerX Frontend

A modern Next.js application for the TriggerX platform, providing a comprehensive interface for blockchain job automation, API management, and developer tools.

## 🚀 Features

- **Job Creation & Management**: Create and manage automated blockchain jobs with various trigger types
- **Dashboard**: Monitor active jobs, view logs, and manage balances
- **API Documentation**: Interactive API documentation with code examples
- **Developer Hub**: Technical articles and resources for developers
- **Leaderboard**: Track contributions and achievements
- **Wallet Integration**: Seamless Web3 wallet connection with RainbowKit
- **Sanity CMS**: Content management for blog posts and documentation

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI, Ant Design, Lucide React icons
- **Web3**: Wagmi, Viem, Ethers.js, RainbowKit
- **State Management**: React Query (TanStack Query)
- **CMS**: Sanity Studio

## 📋 Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Web3 wallet (MetaMask, WalletConnect, etc.)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/trigg3rX/triggerX-frontend-nextjs.git
cd triggerX-frontend-nextjs
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your environment variables:

```env
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.38:9002
NEXT_PUBLIC_API_KEY=your_api_key_here
NEXT_PUBLIC_USER=your_user_here

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=ws://192.168.1.38:9002/api/ws/tasks

# Web3 Configuration (if needed)
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=your_rpc_url
```

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open http://localhost:3000 with your browser to see the result.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── devhub/           # Developer hub pages
│   ├── leaderboard/      # Leaderboard pages
│   └── studio/           # Sanity Studio
├── components/            # React components
│   ├── api/              # API-related components
│   ├── common/           # Shared components
│   ├── create-job/       # Job creation components
│   ├── dashboard/        # Dashboard components
│   ├── devhub/          # DevHub components
│   ├── leaderboard/     # Leaderboard components
│   └── ui/              # UI components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── sanity/               # Sanity CMS configuration
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## 🎯 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### Next.js Configuration

The project uses Next.js 15 with Turbopack for faster development builds. Configuration is in `next.config.ts`.

### Sanity CMS

Content management is handled by Sanity Studio, accessible at `/studio`. Configuration is in `sanity.config.ts`.

### Tailwind CSS

Styling is done with Tailwind CSS with custom animations and responsive design.

## 🌐 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

### Environment Variables for Production

Make sure to set the following environment variables in your deployment platform:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
