"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Bot, Send, X } from "@/components/icons";
import { askAi, type AiContext, type AiMessage } from "@/lib/api";

const quickQuestions = [
  "目前結果代表什麼？",
  "下一個參數應該怎麼調？",
  "這個模型有哪些業界風險？",
];

export function AiAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [receivedContext, setReceivedContext] = useState<AiContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const context = receivedContext?.page === pathname ? receivedContext : { page: pathname };

  useEffect(() => {
    function receiveContext(event: Event) {
      setReceivedContext((event as CustomEvent<AiContext>).detail);
    }
    window.addEventListener("ml-ai-context", receiveContext);
    return () => window.removeEventListener("ml-ai-context", receiveContext);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function submit(nextQuestion?: string) {
    const value = (nextQuestion ?? question).trim();
    if (value.length < 2 || loading) return;
    setQuestion("");
    setError("");
    setLoading(true);
    const userMessage: AiMessage = { role: "user", content: value };
    const history = messages.slice(-6);
    setMessages((current) => [...current, userMessage]);
    try {
      const response = await askAi(value, context, history);
      setMessages((current) => [...current, { role: "model", content: response.answer }]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "AI 助理目前無法回應。";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="ai-trigger" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Bot size={17} /><span>Gemini AI 助理</span>
      </button>
      {open && <button className="ai-backdrop" type="button" aria-label="關閉 AI 助理" onClick={() => setOpen(false)} />}
      {open && <aside className="ai-panel open" role="dialog" aria-modal="true" aria-label="機器學習 AI 助理">
        <header className="ai-panel-header">
          <div><span className="ai-avatar"><Bot size={20} /></span><div><strong>ML 實務助理</strong><small>Gemini · 依目前頁面回答</small></div></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="關閉 AI 助理"><X size={20} /></button>
        </header>
        <div className="ai-context-summary">
          <span>目前情境</span><strong>{context.model ?? context.page}</strong>
          {context.diagnostic_codes?.[0] && <small>{context.diagnostic_codes[0]}</small>}
        </div>
        <div className="ai-messages" aria-live="polite">
          {messages.length === 0 && <div className="ai-welcome"><Bot size={25} /><h2>針對目前結果提問</h2><p>我會讀取目前模型、參數、指標與診斷，但不會取得你的 Gemini API Key。</p></div>}
          {messages.map((message, index) => <div className={`ai-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {loading && <div className="ai-message model loading">正在分析目前實驗...</div>}
          {error && <div className="ai-error" role="alert">{error}</div>}
        </div>
        {messages.length === 0 && <div className="ai-quick-questions">{quickQuestions.map((item) => <button type="button" onClick={() => submit(item)} key={item}>{item}</button>)}</div>}
        <form className="ai-composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <label className="sr-only" htmlFor="ai-question">詢問 AI 助理</label>
          <textarea ref={inputRef} id="ai-question" maxLength={500} rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：為什麼這組參數可能過度擬合？" />
          <button type="submit" disabled={loading || question.trim().length < 2} aria-label="送出問題"><Send size={18} /></button>
        </form>
      </aside>}
    </>
  );
}
