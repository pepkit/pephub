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
            elif data["type"] == "disconnect":
                await manager.disconnect(data["user"], pep_digest)
                await manager.broadcast(data, pep_digest)
            else:
                await manager.broadcast(data, pep_digest)
    except WebSocketDisconnect:
        print("websocket disconnected")


# @ws.websocket("/ws/{spreadsheet_id}/join")
# async def join_room(websocket: WebSocket, spreadsheet_id: str):
#     await manager.connect(websocket, spreadsheet_id, user)
#     await manager.broadcast(f"{user} joined the room.", spreadsheet_id)


# @ws.websocket("/ws/{spreadsheet_id}/leave")
# async def leave_room(websocket: WebSocket, spreadsheet_id: str):
#     manager.disconnect(websocket, spreadsheet_id)
#     await manager.broadcast(f"{user} left the room.", spreadsheet_id)

# @ws.websocket("/ws/{spreadsheet_id}/sync")
# async def sync_data(websocket: WebSocket, spreadsheet_id: str):
#     spreadsheet_data = get_spreadsheet_data(spreadsheet_id)
#     await websocket.send_text(json.dumps(spreadsheet_data))
