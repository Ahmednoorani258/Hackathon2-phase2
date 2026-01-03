-- Migration: Create performance indexes for task organization features
-- Feature: Task Organization (Phase II Intermediate)
-- User Stories: Search, Filtering, Sorting

-- Index for search performance (title and status)
CREATE INDEX idx_tasks_title_trgm ON tasks USING gin(title gin_trgm_ops);

-- Index for date filtering and sorting
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Composite index for common filter combinations
CREATE INDEX idx_tasks_user_status_priority ON tasks(user_id, is_completed, priority);

-- Index for sorting by priority with user filter
CREATE INDEX idx_tasks_user_priority_created ON tasks(user_id, priority, created_at DESC);
