from pydantic import BaseModel, EmailStr
from typing import Optional

# Register ke time frontend se yeh aayega
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

# Login ke time yeh aayega
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Response mein hum password wapas nahi bhejenge, sirf yeh bhejenge
class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    
class Token(BaseModel):
    access_token: str
    token_type: str