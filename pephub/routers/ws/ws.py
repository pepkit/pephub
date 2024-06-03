from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .manager import ConnectionManager

ws = APIRouter(tags=["websocket"])

manager = ConnectionManager()


@ws.websocket("/ws")
async def websocket_connect(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_json()
        await websocket.send_json({"message": data})


@ws.websocket("/ws/{pep_digest}")
async def websocket_endpoint(pep_digest: str, websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            print(data)
            if data["type"] == "connect":
                manager.connect(data["user"], websocket, pep_digest)
                await manager.broadcast(data, pep_digest)
            elif data["type"] == "cell_click":
                manager.user_coords[pep_digest][hash(websocket)] = [
                    data["cell"]["row"],
                    data["cell"]["col"],
                ]
                await manager.broadcast(data, pep_digest)
            else:
                await manager.broadcast(data, pep_digest)
    except (
        WebSocketDisconnect
    ):  # this acts as a disconnect event, like when a user closes the tab
        manager.disconnect(websocket, pep_digest)
        await manager.broadcast({"type": "disconnect"}, pep_digest)
