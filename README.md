
# Stratyx - Professional Forex Backtesting & Trading Platform

## Overview

Stratyx is a comprehensive forex strategy backtesting platform built with React, TypeScript, and Supabase. It allows traders to build, test, and analyze trading strategies against historical market data. 

This project has been enhanced to include:
- **24/7 automated strategy execution** using Supabase Edge Functions and Cron Jobs.
- **Live trade integration** with the OANDA v20 API.
- A manual trade execution feature directly from the user interface.

## Tech Stack

- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Edge Functions, Database, Auth)
- **API**: OANDA v20 REST API

## Features

- **Strategy Builder**: Visual and code-based strategy creation.
- **Backtest Engine**: Comprehensive strategy testing with detailed performance analytics.
- **24/7 Automated Trading**: Run strategies continuously on the server via a cron job.
- **Manual Trading**: Execute trades directly from the application interface.
- **OANDA Integration**: Connects to OANDA's practice environment for live data and trade execution.

---

## 🚀 Local Development Setup

To set up and run this project on your local machine, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (version 18 or higher)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

### Step-by-Step Guide

#### 1. Clone the Repository

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

#### 2. Install Frontend Dependencies

```sh
npm install
```

#### 3. Set up Supabase CLI

Log in to your Supabase account and link the project:

```sh
supabase login
supabase link --project-ref <your-project-ref>
```

You can find your `<your-project-ref>` in your Supabase project's URL:  
`https://supabase.com/dashboard/project/<your-project-ref>`

#### 4. Configure Environment Variables

Create a new file named `.env.local` in the root directory:

```sh
touch .env.local
```

Add the following variables to the `.env.local` file:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

You can find these keys in your Supabase Dashboard under **Project Settings > API**.

---

## ⚙️ Backend & Automation Setup

The backend runs on Supabase Edge Functions and requires secrets and a cron job to be configured.

### 1. Set Supabase Secrets

These secrets are used by Edge Functions to securely connect to the OANDA API:

```sh
supabase secrets set OANDA_API_KEY=your_oanda_api_key_here
supabase secrets set OANDA_ACCOUNT_ID=your_oanda_account_id_here
```

### 2. Deploy Edge Functions

```sh
supabase functions deploy
```

### 3. Schedule the Cron Job for Automation

To run the `strategy-runner` function automatically every minute:

1. Go to your Supabase Dashboard.
2. Navigate to **Database > Cron Jobs**.
3. Click **"Create a new job"**.
4. Fill in the form with:
   - **Name**: `invoke-strategy-runner`
   - **Schedule**: `* * * * *`
   - **Function**: `strategy-runner`
   - **Headers**:
     - **Name**: `Authorization`
     - **Value**: `Bearer <your-anon-key>`

Click **"Create cron job"** to save it.

---

## ▶️ How to Run the Application

After completing all the setup steps, start the development server:

```sh
npm run dev
```

Your application will be available at:  
[http://localhost:5173](http://localhost:5173)
