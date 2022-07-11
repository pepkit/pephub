from pepagent import PepAgent

def get_pep(db: PepAgent, namespace: str, pep_id: str):
    return db.get_project(f"{namespace}/{pep_id}")