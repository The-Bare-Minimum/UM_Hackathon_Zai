# FnB.ai 🍽️

> AI-powered business management platform for F&B SMEs in Malaysia

An intelligent decision-support system that helps food & beverage small businesses make data-driven decisions through AI-powered insights, automated briefings, and real-time business health monitoring.

## 🌟 Overview

FnB.ai transforms how F&B SMEs manage their operations by combining traditional business metrics with cutting-edge AI analysis. Built for the **UM Hackathon 2026** under the theme of **AI for Economic Empowerment & Decision Intelligence**, this platform empowers small business owners with enterprise-level insights without the complexity.

## ✨ Key Features

### 🤖 AI-Powered Intelligence
- **Daily AI Briefings** — Personalized morning summaries powered by Google Gemma 4 26B that analyze your business performance, highlight trends, and provide actionable recommendations
- **Zara AI Chatbot** — Conversational business advisor that answers questions about your sales, inventory, expenses, and provides strategic guidance
- **Anomaly Detection** — Automatically identifies unusual spending patterns, revenue drops, and operational inefficiencies
- **Predictive Insights** — AI-generated forecasts for burn rate, profit margins, and inventory needs

### 📊 Business Management
- **Real-Time Dashboard** — Comprehensive overview of revenue, expenses, inventory alerts, and key performance indicators
- **Inventory Manager** — Track stock levels with automatic low-stock alerts and critical item notifications
- **Financial Monitor** — P&L statements, burn rate analysis, expense breakdowns, and recurring cost tracking
- **Sales Analytics** — Revenue trends, top-selling items, and transaction analysis

### 🎯 Smart Business Rules Engine
- **Customizable Constraints** — Set business rules for food cost ratio, labor cost ratio, profit margins, and more
- **Violation Alerts** — Real-time notifications when your business metrics exceed defined thresholds
- **AI-Guided Recommendations** — Constraint-aware suggestions that respect your business rules

### 📈 Data Import & Visualization
- **CSV Import** — Bulk import sales data from POS systems
- **Interactive Charts** — Beautiful visualizations using Recharts for revenue trends, expense breakdowns, and inventory status
- **Activity History** — Complete audit trail of all inventory changes and business operations

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Database**: Supabase (PostgreSQL + Auth + Row Level Security)
- **AI Model**: Google Gemma 4 26B (via Google AI Studio)
- **State Management**: Zustand
- **Charts**: Recharts
- **Deployment**: Vercel-ready

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd fnb-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials:
   ```env
   # Supabase — get from https://supabase.com dashboard
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Google Gemini AI — get from https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_api_key

   # App Configuration
   NEXT_PUBLIC_APP_NAME=FnB.ai
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   
   Run the SQL migrations in your Supabase SQL Editor in order:
   ```
   migrations/001_initial_schema.sql (database-setup.sql)
   migrations/002_add_finance_tables.sql (phase-5.6-migration.sql)
   migrations/003_add_chat_messages.sql (phase5_chat_messages.sql)
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   
   Visit [http://localhost:3000](http://localhost:3000)

7. **Complete onboarding**
   
   Sign up, complete the business onboarding flow, and click **"Load Demo Data"** on the dashboard to see the platform in action with sample data.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, signup)
│   ├── (dashboard)/       # Main dashboard pages
│   │   ├── dashboard/     # Overview & metrics
│   │   ├── briefings/     # AI briefing history
│   │   ├── chatbot/       # Zara AI chatbot
│   │   ├── finance/       # Financial analytics
│   │   ├── inventory/     # Stock management
│   │   └── customization/ # Business rules configuration
│   ├── (onboarding)/      # Business setup flow
│   └── api/               # API routes
│       ├── ai/            # AI endpoints (briefing, chat, anomaly detection)
│       ├── rules/         # Business rules engine
│       └── seed/          # Demo data seeding
├── components/            # React components organized by feature
│   ├── dashboard/         # Dashboard widgets & cards
│   ├── chatbot/           # AI chatbot interface
│   ├── finance/           # Financial charts & tables
│   ├── inventory/         # Inventory management UI
│   └── ui/                # shadcn/ui base components
├── lib/                   # Utilities & core logic
│   ├── gemini/            # Google Gemini AI client
│   ├── data/              # Data fetching functions
│   └── supabase/          # Supabase client setup
├── hooks/                 # Custom React hooks
├── context/               # React context providers
└── types/                 # TypeScript type definitions
```

## 🎯 Key Features Walkthrough

### 1. AI Daily Briefing
Every morning, FnB.ai generates a personalized briefing that includes:
- Yesterday's performance summary
- Week-over-week trends
- Critical alerts (low stock, high costs, anomalies)
- Actionable recommendations

### 2. Zara AI Chatbot
Ask natural language questions like:
- "How did my business perform this week?"
- "What are my top selling items?"
- "Why did my revenue drop?"
- "What should I restock urgently?"

### 3. Business Rules Engine
Set custom thresholds for:
- Food cost ratio (% of revenue)
- Labor cost ratio (% of revenue)
- Minimum profit margin
- Maximum daily expenses

Get instant alerts when rules are violated and AI recommendations that respect your constraints.

### 4. Financial Analytics
- **P&L Statement**: Revenue, COGS, expenses, and net profit
- **Burn Rate**: Daily cash consumption rate
- **Anomaly Detection**: Unusual spending patterns
- **Recurring Expenses**: Identify and track regular costs

## 🏆 UM Hackathon 2026

**Domain**: AI for Economic Empowerment & Decision Intelligence  
**Category**: Decision-support tool for SMEs  
**Target Users**: F&B small business owners in Malaysia

### Problem Statement
Small F&B businesses struggle with:
- Limited time for data analysis
- Lack of business intelligence tools
- Reactive rather than proactive decision-making
- High operational costs due to inefficiencies

### Our Solution
FnB.ai democratizes AI-powered business intelligence by providing:
- Automated daily insights (no manual analysis needed)
- Conversational AI advisor (no technical expertise required)
- Proactive alerts and recommendations
- Affordable, cloud-based solution

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: All database tables protected with Supabase RLS policies
- **Authentication**: Secure user authentication via Supabase Auth
- **Data Isolation**: Each business's data is completely isolated
- **Environment Variables**: Sensitive credentials stored securely

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app is optimized for Vercel with:
- Automatic API route optimization
- Edge runtime support
- Built-in analytics

## 📝 Environment Variables Reference

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Supabase Dashboard → Settings → API |
| `GEMINI_API_KEY` | Google AI Studio API key | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_APP_NAME` | Application name | `FnB.ai` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` (dev) |

## 🤝 Contributing

This project was built for UM Hackathon 2026. Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Built with ❤️ for UM Hackathon 2026

---

**Made with Next.js, Supabase, and Google Gemma 4 26B**
