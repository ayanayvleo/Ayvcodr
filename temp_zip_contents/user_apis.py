# user_apis.py
"""
This module manages user-defined API endpoints. Each user can define their own endpoint logic via a config or code snippet.
"""
from fastapi import APIRouter, Request
from typing import Callable, Dict

user_routers: Dict[str, APIRouter] = {}

def create_user_router(user_id: str, endpoint_logic: Callable):
    """Create or replace a router for a user's custom endpoint."""
    # Remove old router if it exists
    if user_id in user_routers:
        del user_routers[user_id]
    router = APIRouter()

    @router.post(f"/api/{user_id}/custom")
    async def custom_endpoint(request: Request):
        data = await request.json()
        return endpoint_logic(data)

    user_routers[user_id] = router
    return router
