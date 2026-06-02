import httpx
import json

OLLAMA_URL = "http://localhost:11434/api/chat"

async def generate_sync(messages, model="llama3"):
    """
    Calls Ollama synchronously (waits for full response).
    """
    formatted_messages = [{"role": m.role, "content": m.content} for m in messages]
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": model,
                    "messages": formatted_messages,
                    "stream": False
                },
                timeout=60.0
            )
            if response.status_code == 200:
                data = response.json()
                return {"reply": data.get("message", {}).get("content", "")}
            else:
                return {"reply": f"Error from Ollama: {response.status_code}"}
        except Exception as e:
            return {"reply": f"Failed to connect to Ollama. Error: {str(e)}"}

async def generate_stream(messages, model="llama3"):
    """
    Calls Ollama and yields text chunks as Server-Sent Events (SSE)
    compatible with Vercel AI SDK.
    """
    formatted_messages = [{"role": m.role, "content": m.content} for m in messages]
    
    async with httpx.AsyncClient() as client:
        try:
            async with client.stream(
                "POST",
                OLLAMA_URL,
                json={
                    "model": model,
                    "messages": formatted_messages,
                    "stream": True
                },
                timeout=None
            ) as response:
                if response.status_code != 200:
                    yield f"0:\"Error from Ollama: {response.status_code}\"\n"
                    return
                
                async for line in response.aiter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            if "message" in chunk and "content" in chunk["message"]:
                                text_content = chunk["message"]["content"]
                                # Format for Vercel AI SDK (e.g., '0:"text"\n')
                                # We yield exactly what Next.js expects from an OpenAI-compatible endpoint,
                                # Or we can just yield the raw text and have Next.js format it.
                                # Let's yield raw text chunks here, and format it in Next.js.
                                yield text_content
                        except json.JSONDecodeError:
                            pass
        except Exception as e:
            yield f"\n[Error connecting to Ollama: {str(e)}]"
