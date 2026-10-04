-- MetroCity AI - Supabase Database Schema

-- 1. Create custom types
CREATE TYPE issue_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE issue_status AS ENUM ('Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE data_source_state AS ENUM ('LIVE', 'UPDATED', 'HISTORICAL', 'MANUAL', 'UNAVAILABLE');

-- 2. Create Public Users Table (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'citizen',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Civic Issues Table
CREATE TABLE public.issues (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    reporter_id UUID REFERENCES public.profiles(id),
    status issue_status DEFAULT 'Submitted',
    priority issue_priority DEFAULT 'Low',
    priority_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Issue Audit Logs
CREATE TABLE public.issue_audit_logs (
    id SERIAL PRIMARY KEY,
    issue_id TEXT REFERENCES public.issues(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    note TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Data Sources Registry
CREATE TABLE public.data_sources (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    dataset TEXT NOT NULL,
    connection_state data_source_state DEFAULT 'UNAVAILABLE',
    last_updated TIMESTAMP WITH TIME ZONE,
    coverage TEXT,
    error_status TEXT,
    config JSONB
);

-- 6. Trigger to automatically create a profile when a new auth.user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (new.id, split_part(new.email, '@', 1), new.email, 'admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Dummy Data (Optional: Insert some initial Data Sources)
INSERT INTO public.data_sources (id, provider, dataset, connection_state, coverage)
VALUES 
  ('DS-001', 'ISRO Bhuvan', 'LULC 50K', 'LIVE', 'Maharashtra'),
  ('DS-002', 'OpenStreetMap', 'Road Network', 'LIVE', 'Nalasopara');

-- Note: To create an admin login, go to the Supabase Dashboard -> Authentication -> Users -> Add User.
-- The trigger above will automatically create their profile.
