# Database Setup Instructions

This document provides instructions for setting up the Supabase database for YTAssist.

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Update your `.env` file with the Supabase credentials

## Environment Variables

Create a `.env` file in the root directory with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_PASSWORD=your_app_password
```

## Database Migration

Run the following SQL scripts in your Supabase SQL editor in order:

### 1. Initial Schema (`supabase/migrations/001_initial_schema.sql`)

This creates:
- `contents` table with proper constraints and validation
- `tasks` table for task management
- `settings` table for application configuration
- Indexes for performance
- Triggers for automatic timestamp updates
- Default settings

### 2. Row Level Security (`supabase/migrations/002_rls_policies.sql`)

This sets up:
- RLS policies for all tables
- Permissions for the anon role (since we use password auth)

### 3. Automated Functions (`supabase/migrations/003_automated_functions.sql`)

This creates:
- `create_feedback_tasks()` - Generates feedback analysis tasks
- `cleanup_expired_tasks()` - Removes expired tasks
- `update_content_flags_on_task_completion()` - Updates content flags
- `validate_content_stage_update()` - Validates content stage progression
- Triggers for automatic operations

## Verification

After running the migrations, verify the setup:

1. Check that all tables exist: `contents`, `tasks`, `settings`
2. Verify RLS is enabled on all tables
3. Test the functions work by calling them manually
4. Ensure default settings are inserted

## Scheduled Functions (Optional)

For production use, you may want to set up scheduled functions:

1. **Daily Task Generation**: Run `create_feedback_tasks()` daily
2. **Midnight Cleanup**: Run `cleanup_expired_tasks()` at midnight

This can be done using Supabase Edge Functions or external cron jobs.

## Testing the Setup

You can test the database setup by:

1. Creating a test content item
2. Advancing it to published stage
3. Waiting for automated tasks to be generated
4. Verifying constraints work (try invalid data)

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure RLS policies are correctly set up
2. **Function Not Found**: Make sure all migration scripts ran successfully
3. **Constraint Violations**: Check that data meets the validation requirements
4. **Environment Variables**: Verify `.env` file is properly configured

### Debug Queries

```sql
-- Check table structure
\d contents
\d tasks  
\d settings

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('contents', 'tasks', 'settings');

-- Test functions
SELECT create_feedback_tasks();
SELECT cleanup_expired_tasks();

-- Check default settings
SELECT * FROM settings WHERE key = 'default_final_checks';
```