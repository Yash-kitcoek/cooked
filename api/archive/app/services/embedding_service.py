import os, requests, numpy as np
API=os.getenv("HF_EMBEDDING_MODEL","sentence-transformers/all-MiniLM-L6-v2")
TOKEN=os.getenv("HF_API_TOKEN")
URL=f"https://api-inference.huggingface.co/pipeline/feature-extraction/{API}"
HEAD={"Authorization":f"Bearer {TOKEN}"}
def embed(text:str):
    r=requests.post(URL,headers=HEAD,json={"inputs":text},timeout=30)
    r.raise_for_status()
    v=r.json()
    if isinstance(v[0],list):
        v=np.mean(v,axis=0)
    return np.array(v)
def cosine(a,b):
    a=np.array(a); b=np.array(b)
    return float(np.dot(a,b)/(np.linalg.norm(a)*np.linalg.norm(b)))
