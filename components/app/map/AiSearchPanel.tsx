"use client";

import { useState, useRef, useEffect } from "react";
import { XIcon, PaperPlaneRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { orbitron } from "@/fonts/font";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
};

type ResultProfile = {
  name: string;
  providerType: string;
  city: string;
  imageUrl?: string;
};

type AiSearchPanelProps = {
  open: boolean;
  onClose: () => void;
};

export default function AiSearchPanel({ open, onClose }: AiSearchPanelProps) {
  const t = useTranslations("AiSearchPanel");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<ResultProfile | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    setResult(null);
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: t("mockResponse"),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setResult({
        name: "Aïcha Koné",
        providerType: "Nounou",
        city: "Abidjan, Cocody",
        imageUrl: undefined,
      });
      setThinking(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-95 bg-black/80 backdrop-blur-md border-l border-white/10 z-20 flex flex-col">
      <div className={`flex items-center justify-between px-4 h-14 border-b border-white/10 ${orbitron.className}`}>
        <div className="flex items-center gap-2">
          <SparkleIcon size={18} className="text-[#432dd7]" weight="fill" />
          <span className="text-sm font-medium text-white/90">{t("title")}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white/90 cursor-pointer"
          aria-label={t("close")}
        >
          <XIcon size={18} />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && !thinking && (
          <p className="text-sm text-white/40 text-center mt-8">{t("emptyState")}</p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
              msg.role === "user"
                ? "self-end bg-[#432dd7] text-white"
                : "self-start bg-white/10 text-white/90"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {thinking && (
          <div className="self-start flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" />
          </div>
        )}
        {result && (
          <div className="self-start w-full mt-2 rounded-xl overflow-hidden border border-white/10 bg-white/5">
            <div className="w-full h-32 bg-white/10 flex items-center justify-center">
              {result.imageUrl ? (
                <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-semibold text-white/30">
                  {result.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="p-3 flex flex-col gap-1">
              <p className="text-sm font-medium text-white/90">{result.name}</p>
              <p className="text-xs text-white/50">{result.providerType} · {result.city}</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("inputPlaceholder")}
          className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#432dd7]/60"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || thinking}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-[#432dd7] text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-[#432dd7]/90 transition-colors"
          aria-label={t("send")}
        >
          <PaperPlaneRightIcon size={16} weight="fill" />
        </button>
      </div>
    </div>
  );
}