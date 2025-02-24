-- Create function to handle status updates
CREATE OR REPLACE FUNCTION handle_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status has changed
  IF OLD.status <> NEW.status THEN
    -- Call edge function
    PERFORM
      net.http_post(
        url := CONCAT(
          current_setting('app.settings.edge_function_base_url'),
          '/handle-status-update'
        ),
        body := json_build_object(
          'record', row_to_json(NEW),
          'oldRecord', row_to_json(OLD)
        )::jsonb
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_status_update ON grievances;
CREATE TRIGGER on_status_update
  AFTER UPDATE OF status
  ON grievances
  FOR EACH ROW
  EXECUTE FUNCTION handle_status_update(); 