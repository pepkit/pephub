from typing import Dict, List

from pydantic import BaseModel
from fastapi import WebSocket

from .const import ANONYMOUS_UID
from .utils import random_name_generator


class Connection(BaseModel):
    model_config = {
        "arbitrary_types_allowed": True,
    }
    user: str
    websocket: WebSocket


class ConnectionManager:
    def __init__(self):
        """
        Initialize the connection manager
        """

        # active connections -- the key is the PEP digest, and the value is a dictionary of connections
        # each connection is a dictionary with the hash of the websocket as the key and a Connection object as the value
        # using the hash of the websocket as the key allows us to easily remove connections when a websocket disconnects
        self.active_connections: Dict[str, Dict[str, Connection]] = {}
        self.user_coords: Dict[str, Dict[str, List[int]]] = {}

    def connect(self, uid: str, websocket: WebSocket, pep_digest: str):
        """
        Connect a websocket to a specific PEP

        :param uid: user id
        :param websocket: websocket connection
        :param pep_digest: PEP digest
        """
        if pep_digest not in self.active_connections:
            self.active_connections[pep_digest] = {}
        if uid == ANONYMOUS_UID:
            uid = random_name_generator()
        self.active_connections[pep_digest][hash(websocket)] = Connection(
            user=uid, websocket=websocket
        )
        if pep_digest not in self.user_coords:
            self.user_coords[pep_digest] = {}
        self.user_coords[pep_digest][hash(websocket)] = [0, 0]

    def disconnect(self, websocket: WebSocket, pep_digest: str):
        """
        Disconnect a websocket from a specific PEP

        :param uid: user id
        :param pep_digest: PEP digest
        """
        # remove their connection from the active connections
        if pep_digest in self.active_connections:
            if hash(websocket) in self.active_connections[pep_digest]:
                del self.active_connections[pep_digest][hash(websocket)]

        # remove their coordinates from the user_coords
        if pep_digest in self.user_coords:
            if hash(websocket) in self.user_coords[pep_digest]:
                del self.user_coords[pep_digest][hash(websocket)]

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
        # get list of the hashes
        cnxs = self.active_connections[pep_digest].values()
        sync_data = []
        for cnx in cnxs:
            sync_data.append(
                {
                    "user": cnx.user,
                    "coords": self.user_coords[pep_digest][hash(cnx.websocket)],
                }
            )
        return sync_data
