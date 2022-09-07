from pepdbagent import Connection


def get_pep(db: Connection, namespace: str, pep_id: str):
    return db.get_project(f"{namespace}/{pep_id}")
