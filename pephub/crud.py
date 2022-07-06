from pepagent import PepAgent

def get_pep(db: PepAgent, namespace: str, pep_id: str):
    return db.get_project(project_name=pep_id)