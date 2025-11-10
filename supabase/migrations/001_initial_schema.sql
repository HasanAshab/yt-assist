-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contents table
CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('Demanding', 'Innovative')),
  current_stage INTEGER NOT NULL DEFAULT 0 CHECK (current_stage >= 0 AND current_stage <= 11),
  title TEXT,
  script TEXT,
  final_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  publish_after VARCHAR(255),
  publish_before VARCHAR(255),
  link TEXT,
  morals TEXT[] NOT NULL DEFAULT '{}',
  flags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints for dependencies
  CONSTRAINT fk_publish_after FOREIGN KEY (publish_after) REFERENCES contents(topic) ON DELETE SET NULL,
  CONSTRAINT fk_publish_before FOREIGN KEY (publish_before) REFERENCES contents(topic) ON DELETE SET NULL,
  
  -- Stage validation constraints
  CONSTRAINT check_title_required CHECK (
    (current_stage >= 1 AND title IS NOT NULL AND LENGTH(TRIM(title)) > 0) OR current_stage < 1
  ),
  CONSTRAINT check_script_required CHECK (
    (current_stage >= 5 AND script IS NOT NULL AND LENGTH(TRIM(script)) > 0) OR current_stage < 5
  ),
  CONSTRAINT check_link_required CHECK (
    (current_stage = 11 AND link IS NOT NULL AND LENGTH(TRIM(link)) > 0) OR current_stage < 11
  ),
  
  -- Prevent self-referencing dependencies
  CONSTRAINT check_no_self_dependency CHECK (
    publish_after != topic AND publish_before != topic
  )
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
  description TEXT,
  link TEXT,
  type VARCHAR(10) NOT NULL CHECK (type IN ('user', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Ensure expires_at is in the future when created
  CONSTRAINT check_expires_future CHECK (expires_at > created_at)
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL CHECK (LENGTH(TRIM(key)) > 0),
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contents_topic ON contents(topic);
CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category);
CREATE INDEX IF NOT EXISTS idx_contents_current_stage ON contents(current_stage);
CREATE INDEX IF NOT EXISTS idx_contents_publish_after ON contents(publish_after);
CREATE INDEX IF NOT EXISTS idx_contents_publish_before ON contents(publish_before);
CREATE INDEX IF NOT EXISTS idx_contents_flags ON contents USING GIN(flags);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_expires_at ON tasks(expires_at);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_contents_updated_at 
  BEFORE UPDATE ON contents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('default_final_checks', '["Content reviewed for accuracy", "SEO optimization completed", "Thumbnail approved", "Description finalized", "Tags and categories set"]'::jsonb)
ON CONFLICT (key) DO NOTHING;