import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "lexico_viva_db")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    print("Connecting to MongoDB...")
    try:
        # serverSelectionTimeoutMS=5000 ka matlab hai 5 second tak server dhundega
        db_instance.client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        
        # Asli connection test karne ke liye 'ping' command bhej rahe hain
        await db_instance.client.admin.command('ping')
        
        db_instance.db = db_instance.client[DATABASE_NAME]
        print("✅ Successfully connected to MongoDB! (Verified with Ping)")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB. Server chalu nahi hai!")
        print(f"Error detail: {e}")

async def close_mongo_connection():
    print("Closing MongoDB connection...")
    if db_instance.client is not None:
        db_instance.client.close()
        print("MongoDB connection closed.")

def get_db():
    """Dependency inject karne ke liye function taaki routes DB access kar sakein"""
    return db_instance.db