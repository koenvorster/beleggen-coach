"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BackendChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const SUGGESTED_QUESTIONS = [
  "Welke ETF past bij een beginner?",
  "Wat is het verschil tussen IWDA en VWCE?",
  "Hoe werkt rente op rente?",
  "Is het een goed moment om te beginnen?",
  "Wat is een goede maandelijkse inleg?",
];

const INITIAL_MESSAGE: Message = {
  id: "initial",
  role: "assistant",
  content:
    "Hallo! 👋 Ik ben je persoonlijke BeleggenCoach. Stel me gerust een vraag over ETF's, risico, kosten of hoe je kunt beginnen met beleggen. Ik ben er om te helpen — in gewone taal.",
  timestamp: new Date(),
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Laad chatgeschiedenis bij het openen van de pagina
  useEffect(() => {
    api.chat
      .getHistory(DEV_USER_ID)
      .then((res) => {
        const raw = res.data?.messages ?? [];
        if (raw.length === 0) return;

        const history: Message[] = (raw as BackendChatMessage[])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m, i) => ({
            id: `history-${i}`,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));

        if (history.length > 0) {
          setMessages([INITIAL_MESSAGE, ...history]);
        }
      })
      .catch(() => {
        // Geen geschiedenis beschikbaar — beginnen met lege chat is prima
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    const apiMessages = [...messages, userMsg]
      .filter((m) => m.id !== "initial")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, userId: DEV_USER_ID }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Geen geldig antwoord van de server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Er is iets misgegaan. Probeer het opnieuw." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 py-6 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-xl">
          💬
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Coach</h1>
          <p className="text-sm text-gray-500">Jouw persoonlijke beleggingscoach</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <span className="mt-0.5 shrink-0">⚠️</span>
        <span>
          Deze AI-coach geeft <strong>educatieve informatie</strong>, geen financieel advies. Raadpleeg
          een erkend adviseur voor persoonlijke aanbevelingen.
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm shrink-0 mr-2 mt-1">
                🤖
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary-500 text-white rounded-2xl rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.content || (
                <span className="text-gray-400 italic">Coach typt…</span>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex items-center gap-2 text-gray-400 text-sm pl-10">
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span>Coach typt...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={isStreaming}
            className="text-xs px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-3 items-end card !p-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Stel een vraag over beleggen…"
          rows={2}
          className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="btn-primary !px-4 !py-2 !text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Verstuur →
        </button>
      </div>
    </div>
  );
}
