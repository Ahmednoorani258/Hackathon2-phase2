-- Migration: Create task_tag_assignments junction table
-- Feature: Task Organization (Phase II Intermediate)
-- User Story: Task Tagging/Categorization

CREATE TABLE task_tag_assignments (
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES task_tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, tag_id)
);

-- Add indexes for efficient lookups
CREATE INDEX idx_task_tag_assignments_task_id ON task_tag_assignments(task_id);
CREATE INDEX idx_task_tag_assignments_tag_id ON task_tag_assignments(tag_id);
