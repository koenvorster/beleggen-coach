"""
Beleggingsapp Ollama Client
Lokale AI-integratie via Ollama voor agent-aanroepen.
"""
import structlog
from typing import AsyncGenerator

import httpx

logger = structlog.get_logger(__name__)


class OllamaClient:
    """Client voor communicatie met de lokale Ollama instantie."""

    def __init__(self, base_url: str, timeout: float = 120.0):
        self.base_url = base_url.rstrip("/")
        self._http = httpx.AsyncClient(timeout=timeout)

    async def is_available(self) -> bool:
        """Controleer of Ollama beschikbaar is."""
        try:
            response = await self._http.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> list[str]:
        """Geef een lijst van beschikbare modellen terug."""
        response = await self._http.get(f"{self.base_url}/api/tags")
        response.raise_for_status()
        data = response.json()
        return [m["name"] for m in data.get("models", [])]

    async def generate(
        self,
        prompt: str,
        model: str,
        system: str = "",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """
        Genereer een enkelvoudig antwoord van Ollama.

        Args:
            prompt: De gebruikersvraag of input
            model: Het te gebruiken model (bijv. llama3, mistral)
            system: System prompt
            temperature: Temperatuur (0.0 = deterministisch, 1.0 = creatief)
            max_tokens: Maximum aantal tokens in het antwoord

        Returns:
            Het gegenereerde antwoord als string
        """
        payload: dict = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if system:
            payload["system"] = system

        logger.debug("Ollama generate: model=%s temperature=%s", model, temperature)

        response = await self._http.post(f"{self.base_url}/api/generate", json=payload)
        response.raise_for_status()
        return response.json().get("response", "")

    async def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """
        Chat-interface voor multi-turn gesprekken.

        Args:
            messages: Lijst van berichten [{"role": "user/assistant/system", "content": "..."}]
            model: Het te gebruiken model
            temperature: Temperatuur instelling
            max_tokens: Maximum tokens

        Returns:
            Het antwoord van de assistent
        """
        payload: dict = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        logger.debug("Ollama chat: model=%s berichten=%d", model, len(messages))

        response = await self._http.post(f"{self.base_url}/api/chat", json=payload)
        response.raise_for_status()
        return response.json().get("message", {}).get("content", "")

    async def chat_stream(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming chat-interface (Server-Sent Events).

        Yields:
            Tekst-chunks van het gestreamde antwoord
        """
        import json as json_lib

        payload: dict = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        async with self._http.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.strip():
                    data = json_lib.loads(line)
                    chunk = data.get("message", {}).get("content", "")
                    if chunk:
                        yield chunk
                    if data.get("done"):
                        break

    async def close(self) -> None:
        """Sluit de HTTP-client."""
        await self._http.aclose()


_client: OllamaClient | None = None


def get_client(base_url: str = "http://localhost:11434") -> OllamaClient:
    """Geef de singleton Ollama client terug."""
    global _client
    if _client is None:
        _client = OllamaClient(base_url=base_url)
    return _client
