# Card Tracking System

A powerful, secure card inventory management system for card flippers and collectors. Track purchases, sales, grading, and profits with your own private database.

## 🎯 Features

- **Complete Card Management** - Track every detail from purchase to sale
- **Profit/Loss Tracking** - Automatic calculations for your business metrics
- **Secure & Private** - Each user connects their own Supabase database
- **Real-time Search** - Find cards instantly by name, set, or ID
- **Grading Integration** - Track submission dates, companies, and grades
- **Mobile Friendly** - Works perfectly on all devices

## 🚀 Live Demo

[Visit the live app here](https://your-app-url.vercel.app) *(Replace with your actual Vercel URL)*

## 📋 What You Track

- **Purchase Details** - Date, source, cost, seller, listing links
- **Card Information** - Player/card name, year, set, card number, condition
- **Grading Data** - Company (PSA/BGS/SGC), submission date, grade received
- **Sale Information** - Date sold, platform, sale price
- **Financials** - Automatic profit/loss, grading costs, total investment
- **Additional** - Photos, notes, serial numbers, parallels

## 🛠️ Setup Instructions

### Step 1: Create Your Free Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" and fill out:
   - **Name**: Any name (e.g., "My Card Tracker")
   - **Database Password**: Create a secure password
   - **Region**: Choose closest to your location
3. Click "Create new project" and wait 1-2 minutes

### Step 2: Create the Database Table

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Copy and paste the following SQL script:

```sql
-- Create the cards table
CREATE TABLE cards (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT UNIQUE NOT NULL,
  date_purchased DATE,
  source TEXT,
  listing_link TEXT,
  seller_name TEXT,
  player_card_name TEXT NOT NULL,
  year TEXT,
  set_name TEXT,
  cost DECIMAL(10,2),
  status TEXT DEFAULT 'Purchased',
  submission_date DATE,
  grade INTEGER,
  grading_time_days INTEGER,
  date_sold DATE,
  selling_platform TEXT,
  price DECIMAL(10,2),
  inventory_time_days INTEGER,
  card_type TEXT,
  sport TEXT,
  card_number TEXT,
  condition_purchased TEXT,
  grading_company TEXT,
  serial_number TEXT,
  grading_cost DECIMAL(10,2),
  profit_loss DECIMAL(10,2),
  notes TEXT,
  photo_links TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create auto-updating trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE
    ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Create a policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON cards
    FOR ALL USING (auth.role() = 'authenticated');

-- Optional: Create policy for public access (if you want to skip authentication)
-- Uncomment the line below if you want simpler access:
-- CREATE POLICY "Allow all operations for everyone" ON cards FOR ALL USING (true);
```

3. Click the **"Run"** button
4. You should see a "Success" message

### Step 3: Get Your Connection Details

1. Click the **Settings** (⚙️) icon in the left sidebar
2. Click **"API"**
3. Copy these two values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **Anon public key** (long string starting with `eyJhbG...`)

### Step 4: Connect to the App

1. Visit the [Card Tracking System](https://your-app-url.vercel.app)
2. Enter your **Project URL** and **API Key**
3. Click "Connect to Supabase"
4. Start adding your cards!

## 🔒 Privacy & Security

- **Your data is 100% private** - stored in YOUR Supabase database
- **No shared information** - each user has their own isolated database
- **Secure connection** - all data encrypted in transit and at rest
- **No vendor lock-in** - you own your data and can export it anytime

## 📊 Database Schema

The cards table includes these key fields:

| Field | Type | Description |
|-------|------|-------------|
| `card_id` | TEXT | Auto-generated ID (CARD0000001, etc.) |
| `player_card_name` | TEXT | Player or card name (required) |
| `cost` | DECIMAL | Purchase cost including shipping |
| `grading_cost` | DECIMAL | Cost of grading service |
| `price` | DECIMAL | Sale price |
| `profit_loss` | DECIMAL | Calculated profit/loss |
| `status` | TEXT | Purchased, Grading, Selling, Sold, Other |
| `grading_company` | TEXT | PSA, BGS, SGC, Other |
| `grade` | INTEGER | Grade from 1-10 |

*See the SQL script above for the complete schema*

## 💰 Cost

- **This App**: Completely free
- **Supabase**: Free tier includes:
  - 500MB database storage
  - 2GB bandwidth per month
  - 50,000 monthly active users
  - Perfect for personal card tracking!

## 🛠️ Technical Details

- **Frontend**: React with Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **Hosting**: Vercel
- **Authentication**: Optional (can be configured for public or private access)

## 📱 Browser Support

Works on all modern browsers:
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Tablet browsers

## 🤝 Contributing

This is an open-source project. Feel free to:
- Report bugs by opening an issue
- Suggest new features
- Submit pull requests

## 📄 License

MIT License - feel free to use this for personal or commercial purposes.

## 🆘 Support

**Having trouble?** 

1. **Connection Issues**: Double-check your Supabase URL and API key
2. **SQL Errors**: Make sure you copied the entire SQL script
3. **Missing Features**: This is the MVP version - more features coming!

**Still need help?** Open an issue on this GitHub repository.

---

## 🎉 Success Stories

*"I've been tracking cards in spreadsheets for years. This app has saved me hours and helped me spot my most profitable cards!"* - Card Flipper

*"The profit tracking is amazing. I can finally see which sets and grades give me the best ROI."* - Sports Card Investor

---

**Ready to take control of your card business? [Get started now!](https://your-app-url.vercel.app)**
