-- Add assigned_to column to tasks table
ALTER TABLE tasks 
ADD COLUMN assigned_to TEXT;

-- Create index for assigned_to for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Add comment to document the column
COMMENT ON COLUMN tasks.assigned_to IS 'Name or identifier of the person assigned to this task';