-- =============================================================================
-- MuktoKormo (মুক্তকর্ম) - Enterprise Freelance Marketplace Database Schema
-- Run this complete script in your Supabase Project -> SQL Editor
-- Dashboard URL: https://supabase.com/dashboard/project/dhkhwaazyzikaoaontzn/editor
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE (Public Profile mirror of auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'freelancer' CHECK (role IN ('freelancer', 'client', 'admin')),
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  country TEXT DEFAULT 'Bangladesh',
  avatar TEXT,
  title TEXT,
  intro TEXT,
  hourly_rate NUMERIC DEFAULT 1200,
  category TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  employment JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  portfolio_urls JSONB DEFAULT '[]'::jsonb,
  company_name TEXT,
  website TEXT,
  org_size TEXT,
  wallet_balance_bdt NUMERIC DEFAULT 0,
  is_nid_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. CLIENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  display_name TEXT NOT NULL,
  company_name TEXT,
  industry TEXT,
  company_bio TEXT,
  location TEXT DEFAULT 'Dhaka, Bangladesh',
  avatar_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. FREELANCERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.freelancers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  display_name TEXT NOT NULL,
  title TEXT,
  hourly_rate NUMERIC DEFAULT 1200,
  skills JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  location TEXT DEFAULT 'Dhaka, Bangladesh',
  avatar_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  earned_bdt NUMERIC DEFAULT 0,
  success_rate INTEGER DEFAULT 100,
  is_nid_verified BOOLEAN DEFAULT false,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. ADMINS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  role_level TEXT DEFAULT 'superadmin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. PROJECTS (JOBS) TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_bn TEXT,
  description TEXT NOT NULL,
  description_bn TEXT,
  category TEXT DEFAULT 'Web & App Development',
  job_type TEXT DEFAULT 'Fixed Price',
  experience_level TEXT DEFAULT 'Intermediate',
  budget_bdt NUMERIC NOT NULL DEFAULT 15000,
  budget_min NUMERIC,
  budget_max NUMERIC,
  timeline_days INTEGER DEFAULT 7,
  skills_required JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
  completion_pct INTEGER DEFAULT 0,
  proposals_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. PROPOSALS (BIDS) TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES public.freelancers(id) ON DELETE CASCADE,
  bid_amount NUMERIC NOT NULL,
  platform_fee NUMERIC,
  net_earned NUMERIC,
  delivery_days INTEGER DEFAULT 5,
  bidding_type TEXT DEFAULT 'PROJECT',
  cover_letter TEXT,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  payout_method TEXT DEFAULT 'BKASH',
  payout_account TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. PROPOSAL MILESTONES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proposal_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  amount_bdt NUMERIC NOT NULL,
  delivery_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. CONTRACTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'DISPUTED')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 9. PAYOUT METHODS TABLE (bKash / Nagad / Rocket / Bank)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_methods (
  id TEXT PRIMARY KEY,
  user_id UUID,
  type TEXT NOT NULL CHECK (type IN ('BKASH', 'NAGAD', 'ROCKET', 'BANK')),
  account_type TEXT DEFAULT 'Personal',
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  bank_name TEXT,
  branch_name TEXT,
  routing_number TEXT,
  is_primary BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'VERIFIED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. WALLET TRANSACTIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID,
  label TEXT NOT NULL,
  label_bn TEXT,
  method TEXT NOT NULL,
  amount_bdt NUMERIC NOT NULL,
  status TEXT DEFAULT 'COMPLETED',
  trx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 11. MESSAGES TABLE (Real-Time Messaging Storage)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  contract_id TEXT,
  conversation_id TEXT,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT CHECK (sender_role IN ('client', 'freelancer', 'admin', 'system')),
  message_text TEXT NOT NULL,
  is_client BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 12. SAVED TALENT TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_talent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID,
  freelancer_id UUID REFERENCES public.freelancers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, freelancer_id)
);

-- -----------------------------------------------------------------------------
-- 13. ENSURE UNIQUE CONSTRAINTS (For upsert onConflict: "user_id")
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_freelancers_user_id ON public.freelancers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- -----------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES - PERMISSIVE FOR APP OPERATIONS
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_talent ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if re-running
DROP POLICY IF EXISTS "Public can view users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all users operations" ON public.users;
DROP POLICY IF EXISTS "Public can view clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all client operations" ON public.clients;
DROP POLICY IF EXISTS "Public can view freelancers" ON public.freelancers;
DROP POLICY IF EXISTS "Allow all freelancer operations" ON public.freelancers;
DROP POLICY IF EXISTS "Public can view open projects" ON public.projects;
DROP POLICY IF EXISTS "Clients can create projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all project operations" ON public.projects;
DROP POLICY IF EXISTS "Public can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Freelancers can submit proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow all proposal operations" ON public.proposals;
DROP POLICY IF EXISTS "Public can view proposal milestones" ON public.proposal_milestones;
DROP POLICY IF EXISTS "Proposals can insert milestones" ON public.proposal_milestones;
DROP POLICY IF EXISTS "Allow all proposal_milestones operations" ON public.proposal_milestones;
DROP POLICY IF EXISTS "Public can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Contracts can be created" ON public.contracts;
DROP POLICY IF EXISTS "Allow all contract operations" ON public.contracts;
DROP POLICY IF EXISTS "Users can manage payout methods" ON public.payout_methods;
DROP POLICY IF EXISTS "Allow all payout_methods operations" ON public.payout_methods;
DROP POLICY IF EXISTS "Users can view transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Allow all wallet_transactions operations" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Allow all messages operations" ON public.messages;
DROP POLICY IF EXISTS "Allow all saved_talent operations" ON public.saved_talent;

-- Create full read/write policies for web client
CREATE POLICY "Allow all users operations" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all client operations" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all freelancer operations" ON public.freelancers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all project operations" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all proposal operations" ON public.proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all proposal_milestones operations" ON public.proposal_milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all contract operations" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all payout_methods operations" ON public.payout_methods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all wallet_transactions operations" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all messages operations" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all saved_talent operations" ON public.saved_talent FOR ALL USING (true) WITH CHECK (true);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project ON public.proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_freelancer ON public.proposals(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal ON public.contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_contract ON public.messages(contract_id);
