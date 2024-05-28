from fastapi import APIRouter, WebSocket

ws = APIRouter(prefix="/api/v1", tags=["websocket"])


@ws.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_json()
        print(data)
        await websocket.send_json({"message": data})
