#!/usr/bin/env python
"""
Database migration script to add missing columns to existing tables.
This will ALTER the database schema to match the updated models.
"""

import os
from dotenv import load_dotenv
from sqlmodel import create_engine, text
from sqlalchemy import inspect

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    exit(1)

# Convert postgres:// to postgresql:// if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def migrate_database():
    """Migrate database schema to add missing columns and tables."""
    engine = create_engine(DATABASE_URL, echo=True)
    
    # Separate transaction for priority column
    with engine.begin() as connection:
        try:
            # Check if priority column exists using information schema
            result = connection.execute(text("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='task' AND column_name='priority'
                )
            """))
            column_exists = result.scalar()
            
            if column_exists:
                print("✓ priority column already exists")
            else:
                print(f"✗ priority column missing, adding it...")
                connection.execute(text("ALTER TABLE task ADD COLUMN priority VARCHAR NOT NULL DEFAULT 'medium'"))
                print("✓ Added priority column to task table")
        except Exception as e:
            print(f"Error checking/adding priority column: {e}")
    
    # Separate transaction for task_tags table
    with engine.begin() as connection:
        try:
            result = connection.execute(text("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name='task_tags'
                )
            """))
            table_exists = result.scalar()
            
            if table_exists:
                print("✓ task_tags table already exists")
            else:
                print(f"✗ task_tags table missing, creating it...")
                connection.execute(text("""
                    CREATE TABLE task_tags (
                        id SERIAL PRIMARY KEY,
                        user_id VARCHAR NOT NULL,
                        name VARCHAR(50) NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
                    )
                """))
                print("✓ Created task_tags table")
        except Exception as create_error:
            print(f"Error checking/creating task_tags table: {create_error}")
    
    # Separate transaction for task_tag_assignments table
    with engine.begin() as connection:
        try:
            result = connection.execute(text("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name='task_tag_assignments'
                )
            """))
            table_exists = result.scalar()
            
            if table_exists:
                print("✓ task_tag_assignments table already exists")
            else:
                print(f"✗ task_tag_assignments table missing, creating it...")
                connection.execute(text("""
                    CREATE TABLE task_tag_assignments (
                        task_id INTEGER NOT NULL,
                        tag_id INTEGER NOT NULL,
                        assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (task_id, tag_id),
                        FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
                        FOREIGN KEY (tag_id) REFERENCES task_tags(id) ON DELETE CASCADE
                    )
                """))
                print("✓ Created task_tag_assignments table")
        except Exception as create_error:
            print(f"Error checking/creating task_tag_assignments table: {create_error}")

if __name__ == "__main__":
    print("Starting database migration...")
    migrate_database()
    print("Migration complete!")
