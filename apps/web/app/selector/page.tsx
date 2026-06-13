"use client";

import { useState } from "react";
import Link from "next/link";

import { ArrowRight, ClipboardCheck, FlaskConical } from "@/components/icons";
import { fetchRecommendation, type RecommendationRequest, type RecommendationResponse } from "@/lib/api";

const initialForm: RecommendationRequest = {
  task: "classification",
  data_type: "tabular",
  sample_size: "medium",
  explainability: "high",
  class_imbalance: false,
  latency_sensitive: false,
};

export default function SelectorPage() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setResult(await fetchRecommendation(form));
    } catch {
      setError("無法取得建議，請確認 FastAPI 服務已啟動。");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof RecommendationRequest>(key: K, value: RecommendationRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="page-shell inner-page">
      <div className="page-intro"><span>MODEL SELECTION</span><h1>把業務限制轉成模型候選清單</h1><p>這不是自動替你決策的黑箱。系統會提出一個透明基準、一個比較模型，並說明風險與應追蹤指標。</p></div>
      <div className="selector-layout">
        <section className="selector-panel">
          <form className="selector-form" onSubmit={submit}>
            <div className="field"><label htmlFor="task">要解決的任務</label><select id="task" value={form.task} onChange={(e) => update("task", e.target.value as RecommendationRequest["task"])}><option value="regression">預測連續數值</option><option value="classification">判斷類別或風險</option><option value="clustering">探索未標記群組</option><option value="reduction">高維資料壓縮</option></select></div>
            <div className="field"><label htmlFor="data-type">主要資料型態</label><select id="data-type" value={form.data_type} onChange={(e) => update("data_type", e.target.value as RecommendationRequest["data_type"])}><option value="tabular">表格資料</option><option value="text">文字或稀疏資料</option><option value="image">影像</option><option value="high-dimensional">高維感測或生物資料</option></select></div>
            <div className="field"><label htmlFor="sample-size">資料規模</label><select id="sample-size" value={form.sample_size} onChange={(e) => update("sample_size", e.target.value as RecommendationRequest["sample_size"])}><option value="small">小型，少於一萬筆</option><option value="medium">中型，一萬至百萬筆</option><option value="large">大型，百萬筆以上</option></select></div>
            <div className="field"><label htmlFor="explainability">可解釋性要求</label><select id="explainability" value={form.explainability} onChange={(e) => update("explainability", e.target.value as RecommendationRequest["explainability"])}><option value="high">高，需要向人員說明</option><option value="medium">中，可用輔助解釋</option><option value="low">低，表現優先</option></select></div>
            <label className="check-field"><input type="checkbox" checked={form.class_imbalance} onChange={(e) => update("class_imbalance", e.target.checked)} /><span>正負案例嚴重不平衡，accuracy 可能誤導</span></label>
            <label className="check-field"><input type="checkbox" checked={form.latency_sensitive} onChange={(e) => update("latency_sensitive", e.target.checked)} /><span>線上推論延遲與成本很敏感</span></label>
            <button type="submit" disabled={loading}>{loading ? "分析限制中..." : "產生模型建議"}</button>
          </form>
          {error && <div className="error-banner" role="alert">{error}</div>}
        </section>
        <section aria-live="polite">
          {!result ? <div className="result-empty"><div><ClipboardCheck size={42} /><h2>等待問題條件</h2><p>完成左側條件後，這裡會顯示可驗證的模型建議，而不是單一答案。</p></div></div> : (
            <article className="result-card">
              <span className="eyebrow">RECOMMENDATION</span><h2>先做基準，再做比較</h2>
              <div className="recommend-pair"><div><span>透明基準</span><strong>{result.baseline}</strong></div><div><span>比較候選</span><strong>{result.comparison}</strong></div></div>
              <h3>為什麼這樣選</h3><ul className="plain-list">{result.reasons.map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>上線前風險</h3><ul className="plain-list">{result.risks.map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>建議追蹤</h3><div className="metric-chips">{result.metrics.map((item) => <span key={item}>{item}</span>)}</div>
              {result.suggested_lab && <Link className="lab-cta" href={`/lab?model=${result.suggested_lab}`}><FlaskConical size={20} /><span><strong>用參數實驗驗證建議</strong><small>改變模型複雜度並觀察泛化與營運取捨</small></span><ArrowRight size={20} /></Link>}
            </article>
          )}
        </section>
      </div>
    </div>
  );
}
