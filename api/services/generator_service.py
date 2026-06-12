import google.generativeai as genai
import os
import base64

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

from services.db import get_auto_config

def generate_custom_post(prompt: str, image_base64: str = None) -> dict:
    """Uses Google Gemini to generate custom post content from a prompt and optional image."""
    if not prompt:
        return {"success": False, "error": "Prompt cannot be empty"}
    
    models_to_try = ["gemini-3.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    
    parts = [prompt]
    
    # If image is provided, decode and add to parts
    if image_base64:
        try:
            # Strip data:image/...;base64, prefix if present
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            
            image_bytes = base64.b64decode(image_base64)
            # We assume a generic image/jpeg or let Gemini infer it
            parts.append({
                "mime_type": "image/jpeg", 
                "data": image_bytes
            })
        except Exception as e:
            return {"success": False, "error": f"Invalid image format: {str(e)}"}
            
    last_error = None
    config = get_auto_config()
    system_instruction = config.get("aiPromptRules", "")
    
    for model_name in models_to_try:
        try:
            if system_instruction:
                model = genai.GenerativeModel(model_name, system_instruction=system_instruction)
            else:
                model = genai.GenerativeModel(model_name)
            response = model.generate_content(parts)
            if response and response.text:
                return {
                    "success": True,
                    "content": response.text.strip(),
                    "model_used": model_name
                }
        except Exception as e:
            last_error = e
            print(f"Generator Error ({model_name}): {e}")
            
    return {"success": False, "error": f"Failed to generate after trying multiple models: {str(last_error)}"}
