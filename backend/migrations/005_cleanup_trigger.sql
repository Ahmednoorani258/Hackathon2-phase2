-- Migration: Create auto-delete trigger for unused tags
-- Feature: Task Organization (Phase II Intermediate)
-- User Story: Task Tagging/Categorization

-- Function to delete tags with no assignments
CREATE OR REPLACE FUNCTION delete_unused_tags()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM task_tags
    WHERE id = OLD.tag_id
    AND NOT EXISTS (
        SELECT 1 FROM task_tag_assignments
        WHERE tag_id = OLD.tag_id
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger on task_tag_assignments deletion
CREATE TRIGGER trigger_delete_unused_tags
AFTER DELETE ON task_tag_assignments
FOR EACH ROW
EXECUTE FUNCTION delete_unused_tags();
