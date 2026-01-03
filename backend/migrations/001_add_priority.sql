-- Migration: Add priority column to tasks table
-- Feature: Task Organization (Phase II Intermediate)
-- User Story: Task Prioritization

ALTER TABLE tasks
ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium',
ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('high', 'medium', 'low'));

-- Add index for priority filtering
CREATE INDEX idx_tasks_priority ON tasks(priority);
