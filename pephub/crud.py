from pepdbagent import Connection


def get_pep(db: Connection, namespace: str, project: str):
    return db.get_project(f"{namespace}/{project}")
