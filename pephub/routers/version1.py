from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "welcome to the pepserver"}
