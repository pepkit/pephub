from typing import Dict, List

from pydantic import BaseModel
from fastapi import WebSocket


class Connection(BaseModel):
    model_config = {
        "arbitrary_types_allowed": True,
    }
    user: str
    websocket: WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, Connection]] = {}

    def connect(self, uid: str, websocket: WebSocket, pep_digest: str):
        """
        Connect a websocket to a specific PEP

        :param uid: user id
        :param websocket: websocket connection
        :param pep_digest: PEP digest
        """
        if pep_digest not in self.active_connections:
            self.active_connections[pep_digest] = {}
        self.active_connections[pep_digest][uid] = Connection(
            user=uid, websocket=websocket
        )

    async def disconnect(self, uid: str, pep_digest: str):
        """
        Disconnect a websocket from a specific PEP

        :param uid: user id
        :param pep_digest: PEP digest
        """
        if pep_digest in self.active_connections:
            cnx = self.active_connections[pep_digest][uid]
            del self.active_connections[pep_digest][uid]
            await cnx.websocket.close()

    async def broadcast(self, message: dict, pep_digest: str):
        """
        Broadcast a message to all connected websockets for a specific PEP

        :param message: message to broadcast
        :param pep_digest: PEP digest
        """
        # add current sync data to message
        message["sync_data"] = self.get_sync_data(pep_digest)
        if pep_digest in self.active_connections:
            for connection in self.active_connections[pep_digest].values():
                await connection.websocket.send_json(message)

    def get_sync_data(self, pep_digest: str) -> List[dict]:
        """
        Get sync data for a specific PEP

        :param pep_digest: PEP digest
        :return: list of sync data
        """
        return [
            {"user": connection.user}
            for connection in self.active_connections[pep_digest].values()
        ]
