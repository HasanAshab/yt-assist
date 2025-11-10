-- Function to create feedback analysis tasks for published content
CREATE OR REPLACE FUNCTION create_feedback_tasks()
RETURNS void AS $$
DECLARE
  content_record RECORD;
  task_title TEXT;
  task_link TEXT;
  end_of_day TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate end of current day for task expiration
  end_of_day := DATE_TRUNC('day', NOW() + INTERVAL '1 day');
  
  -- Create fans feedback analysis tasks (2 days after publish)
  FOR content_record IN 
    SELECT id, topic, created_at
    FROM contents 
    WHERE current_stage = 11 -- Published stage
      AND NOT ('fans_feedback_analysed' = ANY(flags))
      AND created_at <= NOW() - INTERVAL '2 days'
  LOOP
    task_title := 'Analyse Fans Feedback on ' || content_record.topic;
    task_link := '/content/' || content_record.id || '/edit';
    
    -- Check if task already exists
    IF NOT EXISTS (
      SELECT 1 FROM tasks 
      WHERE title = task_title 
      AND type = 'system'
    ) THEN
      INSERT INTO tasks (title, description, link, type, expires_at)
      VALUES (
        task_title,
        'Analyze fan feedback and engagement for published content after 2 days',
        task_link,
        'system',
        end_of_day
      );
    END IF;
  END LOOP;
  
  -- Create overall feedback analysis tasks (10 days after publish)
  FOR content_record IN 
    SELECT id, topic, created_at
    FROM contents 
    WHERE current_stage = 11 -- Published stage
      AND NOT ('overall_feedback_analysed' = ANY(flags))
      AND created_at <= NOW() - INTERVAL '10 days'
  LOOP
    task_title := 'Analyse Overall Feedback on ' || content_record.topic;
    task_link := '/content/' || content_record.id || '/edit';
    
    -- Check if task already exists
    IF NOT EXISTS (
      SELECT 1 FROM tasks 
      WHERE title = task_title 
      AND type = 'system'
    ) THEN
      INSERT INTO tasks (title, description, link, type, expires_at)
      VALUES (
        task_title,
        'Analyze overall feedback, performance metrics, and long-term engagement after 10 days',
        task_link,
        'system',
        end_of_day
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired tasks (runs at midnight)
CREATE OR REPLACE FUNCTION cleanup_expired_tasks()
RETURNS void AS $$
BEGIN
  DELETE FROM tasks 
  WHERE expires_at <= NOW() 
  AND type = 'user'; -- Only auto-delete user tasks, keep system tasks for manual completion
  
  -- Log cleanup activity
  RAISE NOTICE 'Cleaned up expired tasks at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update content flags when feedback tasks are completed
CREATE OR REPLACE FUNCTION update_content_flags_on_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  content_topic TEXT;
  flag_to_set TEXT;
BEGIN
  -- Extract content topic from task title
  IF OLD.title LIKE 'Analyse Fans Feedback on %' THEN
    content_topic := SUBSTRING(OLD.title FROM 'Analyse Fans Feedback on (.+)');
    flag_to_set := 'fans_feedback_analysed';
  ELSIF OLD.title LIKE 'Analyse Overall Feedback on %' THEN
    content_topic := SUBSTRING(OLD.title FROM 'Analyse Overall Feedback on (.+)');
    flag_to_set := 'overall_feedback_analysed';
  ELSE
    RETURN OLD; -- Not a feedback analysis task
  END IF;
  
  -- Update the content flags
  UPDATE contents 
  SET flags = array_append(flags, flag_to_set)
  WHERE topic = content_topic 
  AND NOT (flag_to_set = ANY(flags)); -- Only add if not already present
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic flag updates when tasks are deleted (completed)
CREATE TRIGGER trigger_update_content_flags_on_task_completion
  BEFORE DELETE ON tasks
  FOR EACH ROW
  WHEN (OLD.type = 'system' AND (OLD.title LIKE 'Analyse % Feedback on %'))
  EXECUTE FUNCTION update_content_flags_on_task_completion();

-- Function to validate content stage progression
CREATE OR REPLACE FUNCTION validate_content_stage_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate title requirement
  IF NEW.current_stage >= 1 AND (NEW.title IS NULL OR LENGTH(TRIM(NEW.title)) = 0) THEN
    RAISE EXCEPTION 'Title is required for stage % and above', NEW.current_stage;
  END IF;
  
  -- Validate script requirement
  IF NEW.current_stage >= 5 AND (NEW.script IS NULL OR LENGTH(TRIM(NEW.script)) = 0) THEN
    RAISE EXCEPTION 'Script is required for stage % and above', NEW.current_stage;
  END IF;
  
  -- Validate link requirement for published content
  IF NEW.current_stage = 11 AND (NEW.link IS NULL OR LENGTH(TRIM(NEW.link)) = 0) THEN
    RAISE EXCEPTION 'Link is required for published content';
  END IF;
  
  -- Validate final checks completion for published content
  IF NEW.current_stage = 11 THEN
    -- Check if all final checks are completed
    IF NOT (
      SELECT bool_and((item->>'completed')::boolean)
      FROM jsonb_array_elements(NEW.final_checks) AS item
    ) THEN
      RAISE EXCEPTION 'All final checks must be completed before publishing';
    END IF;
  END IF;
  
  -- Validate publish_after dependency
  IF NEW.current_stage = 11 AND NEW.publish_after IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM contents 
      WHERE topic = NEW.publish_after 
      AND current_stage = 11
    ) THEN
      RAISE EXCEPTION 'Cannot publish: dependency "%" is not yet published', NEW.publish_after;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for content validation
CREATE TRIGGER trigger_validate_content_stage_update
  BEFORE INSERT OR UPDATE ON contents
  FOR EACH ROW
  EXECUTE FUNCTION validate_content_stage_update();