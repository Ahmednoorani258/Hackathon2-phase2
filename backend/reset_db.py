"""
Reset database schema by dropping all tables and recreating them.
This is for development only.
"""

from sqlmodel import SQLModel, Session, select
from db import engine
from models import User, Task

def reset_database():
    # Drop all tables
    SQLModel.metadata.drop_all(engine)
    print("✓ Dropped all tables")
    
    # Recreate all tables
    SQLModel.metadata.create_all(engine)
    print("✓ Created all tables")

if __name__ == "__main__":
    reset_database()
    print("Database reset complete!")
