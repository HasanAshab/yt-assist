-- Enable Row Level Security on all tables
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Since this is a single-user application with password auth,
-- we'll create policies that allow all operations for authenticated sessions
-- In a real multi-user scenario, you'd want user-specific policies

-- Contents table policies
CREATE POLICY "Allow all operations on contents" ON contents
  FOR ALL USING (true) WITH CHECK (true);

-- Tasks table policies  
CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Settings table policies
CREATE POLICY "Allow all operations on settings" ON settings
  FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions to anon role (since we're not using Supabase auth)
GRANT ALL ON contents TO anon;
GRANT ALL ON tasks TO anon;
GRANT ALL ON settings TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;