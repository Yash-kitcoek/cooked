import json
import logging
from typing import TypedDict, List
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

class LLMComplaintResult(TypedDict):
    department: str
    category: str
    priority: str
    priority_reasons: List[str]

def analyze_complaint_with_llm(title: str, description: str, allowed_departments: List[str]) -> LLMComplaintResult | None:
    if not settings.hf_token or not settings.hf_model:
        logger.warning("HF token or model not configured. Skipping LLM categorization.")
        return None
        
    url = f"https://api-inference.huggingface.co/models/{settings.hf_model}"
    headers = {
        "Authorization": f"Bearer {settings.hf_token}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""<|im_start|>system
You are an AI grievance classifier for an institution. 
You must analyze the complaint and output raw JSON ONLY.
Do not output markdown, code blocks, or any conversational text. Just the JSON object.
<|im_end|>
<|im_start|>user
Allowed Departments: {', '.join(allowed_departments)}

Complaint Title: {title}
Complaint Description: {description}

Expected JSON Format:
{{
  "department": "Exact match from one of the allowed departments based on the complaint text",
  "category": "A short 1-3 word category describing the issue (e.g. Plumbing, Electrical, Grading, Network)",
  "priority": "One of: low, normal, high, urgent",
  "priority_reasons": ["Brief reason 1 for the priority", "Brief reason 2 (if applicable)"]
}}
<|im_end|>
<|im_start|>assistant
"""
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 256,
            "return_full_text": False,
            "temperature": 0.1,
            "top_p": 0.9,
        }
    }
    
    try:
        with httpx.Client(timeout=8.0) as client:
            response = client.post(url, headers=headers, json=payload)
            if response.status_code == 503:
                logger.warning("HF API returned 503 (model loading). Falling back immediately.")
                return None
            response.raise_for_status()
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
            else:
                generated_text = str(result)
                
            cleaned_text = generated_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
                
            try:
                data = json.loads(cleaned_text.strip())
            except json.JSONDecodeError:
                logger.error("LLM returned malformed JSON")
                return None
            
            # Validate required fields and constraints
            if not all(k in data for k in ("department", "category", "priority", "priority_reasons")):
                logger.error(f"LLM returned invalid schema: {data}")
                return None
                
            if data["department"] not in allowed_departments:
                logger.error(f"LLM returned invalid department: {data['department']}")
                return None
                
            if data["priority"] not in ["low", "normal", "high", "urgent"]:
                logger.error(f"LLM returned invalid priority: {data['priority']}")
                return None
                
            return data
                
    except httpx.TimeoutException:
        logger.warning("HF API timed out. Falling back.")
        return None
    except Exception as e:
        logger.error(f"LLM categorization failed: {e}")
        return None
