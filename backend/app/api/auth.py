from fastapi import APIRouter, HTTPException, status, Depends,Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from bson import ObjectId
from app.models.user import UserUpdate, UserCreate, UserLogin, UserResponse, Token
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    db = get_db()
    
    # 1. Check if user already exists
    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash the password
    hashed_password = get_password_hash(user.password)
    
    # 3. Save to MongoDB
    user_dict = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_password
    }
    result = await db["users"].insert_one(user_dict)
    
    # 4. Return success response
    # return UserResponse(
    #     id=str(result.inserted_id),
    #     name=user.name,
    #     email=user.email
    # )
    return  {
   "success": True
}

@router.post("/login", response_model=Token)
async def login_user(user: UserLogin):
    db = get_db()
    
    # 1. Find user by email
    db_user = await db["users"].find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # 2. Verify password
    if not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # 3. Create JWT Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user["_id"])}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Token decode karke user_id nikal rahe hain
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    # Database se user fetch karna
    db = get_db()
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
        
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"]
    )


@router.put("/update")
async def update_profile(update_data: UserUpdate, authorization: str = Header(...)):
    try:
        # Consistency ke liye db connection yahan bhi initialize karo
        db = get_db()
        
        # 1. Token extract karo
        token = authorization.split(" ")[1]
        
        # FIX: os.getenv ki jagah security se imported SECRET_KEY aur ALGORITHM use karo
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # FIX: Login time pe humne "sub" mein user_id (ObjectId string) save kiya tha, email nahi!
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
            
        # FIX: Database mein email ki jagah ObjectId se dhundo
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_fields = {}

        # 2. Agar naya naam aaya hai, toh update list mein daalo
        if update_data.name:
            update_fields["name"] = update_data.name

        # 3. Agar password change ki request aayi hai
        if update_data.current_password and update_data.new_password:
            if not verify_password(update_data.current_password, user["hashed_password"]):
                raise HTTPException(status_code=400, detail="Incorrect current password")
            update_fields["hashed_password"] = get_password_hash(update_data.new_password)

        # 4. Database mein save karo (Yahan bhi ObjectId se update hoga)
        if update_fields:
            await db["users"].update_one(
                {"_id": ObjectId(user_id)}, 
                {"$set": update_fields}
            )
            return {"message": "Profile updated successfully!"}
            
        return {"message": "No changes made."}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))