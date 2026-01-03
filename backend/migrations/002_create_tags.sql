-- Migration: Create task_tags table
-- Feature: Task Organization (Phase II Intermediate)
-- User Story: Task Tagging/Categorization

CREATE TABLE task_tags (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT task_tags_user_name_unique UNIQUE (user_id, name)
);

-- Add index for user_id lookups
CREATE INDEX idx_task_tags_user_id ON task_tags(user_id);
