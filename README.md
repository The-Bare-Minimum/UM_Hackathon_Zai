# FnB.ai — The Intelligent Co-Pilot for Malaysian F&B SMEs

![FnB.ai Banner](https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200&h=400)

## 🚀 Revolutionizing Restaurant Management with Edge AI

FnB.ai is a production-grade management platform designed specifically for the Malaysian F&B ecosystem. It empowers restaurant owners with real-time financial monitoring, intelligent inventory management, and data-driven business insights powered by **Google Gemini**.

---

## ✨ Key Features

### 🧠 Zara: Your AI Business Partner
- **Daily Briefings**: Start your morning with a "Newspaper Style" briefing summarizing yesterday's performance and today's focus.
- **Context-Aware Chat**: Talk to Zara about your sales, expenses, and inventory. She knows your data and gives actionable advice.
- **Anomaly Detection**: Zara automatically flags unusual expense patterns or sudden revenue drops.

### 📊 Real-Time Financial Monitor
- **P&L at a Glance**: Real-time Gross Profit and Net Margin tracking.
- **Labor Cost Ratio**: Automatic monitoring of staff efficiency against revenue.
- **Profitability Forecasting**: Predictive analysis of your next 30 days based on historical trends.

### 📦 Intelligent Inventory & Invoicing
- **Snap Invoice**: Take a photo of any supplier invoice. Our Vision AI extracts items, prices, and categories instantly.
- **Auto-Restock Recommendations**: AI-driven suggestions on what to order based on burn rates and upcoming demand.
- **Waste Tracking**: Monitor ingredient shelf-life and reduce wastage with proactive alerts.

### 🛠️ Built for Malaysia
- **Local Context**: Supports MYR, local bank transfer methods, and common Malaysian F&B categories.
- **POS Integration**: Import sales data via CSV from popular Malaysian POS systems.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Next.js Server Actions & API Routes
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: Google Gemma 4 26B
- **Image Processing**: Sharp (Edge Compression)
- **State Management**: Zustand & React Context

---

## ⚙️ Environment Setup

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. **Initialize Database**: Run the SQL scripts in `/supabase/migrations` or use `database-setup.sql`.
5. **Start Development**: `npm run dev`

---

## 🏆 Hackathon Submission Details
- **Project Name**: FnB.ai
- **Theme**: SME Digitalization & AI Empowerment
- **Target Audience**: Malaysian F&B Restaurant Owners & Managers

---

Developed with ❤️ for the UM Hackathon 2026.
