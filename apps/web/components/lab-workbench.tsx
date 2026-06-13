"use client";

import { useEffect, useMemo, useState } from "react";

import { RefreshCw } from "@/components/icons";
import { fetchExperiment, type ExperimentPoint, type ExperimentResponse } from "@/lib/api";

type LabId = "ridge" | "logistic" | "decision-tree" | "svm" | "knn" | "kmeans";
type Control = { label: string; min: number; max: number; step: number; initial: number; help: string };
type LabConfig = { label: string; primary: Control; secondary: Control };

const configs: Record<LabId, LabConfig> = {
  ridge: { label: "Ridge 回歸", primary: { label: "正則化 alpha", min: 0, max: 30, step: .5, initial: 1, help: "越大越壓縮係數，降低變異但可能欠擬合。" }, secondary: { label: "資料雜訊", min: .05, max: 1, step: .05, initial: .35, help: "模擬量測誤差與未觀測因素。" } },
  logistic: { label: "邏輯回歸", primary: { label: "C", min: .05, max: 20, step: .05, initial: 1, help: "越小代表正則化越強。" }, secondary: { label: "分類門檻", min: .1, max: .9, step: .05, initial: .5, help: "直接改變召回率與人工覆核量。" } },
  "decision-tree": { label: "決策樹", primary: { label: "最大深度", min: 1, max: 12, step: 1, initial: 4, help: "深度越高，規則越細，也更容易過度擬合。" }, secondary: { label: "葉節點最小樣本", min: 1, max: 25, step: 1, initial: 6, help: "提高此值可抑制只服務少數樣本的規則。" } },
  svm: { label: "SVM", primary: { label: "C", min: .05, max: 30, step: .05, initial: 2, help: "越高越不容忍訓練錯誤。" }, secondary: { label: "gamma", min: .03, max: 5, step: .03, initial: .7, help: "越高代表單一樣本的影響範圍越小。" } },
  knn: { label: "KNN", primary: { label: "鄰居數 k", min: 1, max: 35, step: 1, initial: 9, help: "太小追隨雜訊，太大則過度平滑。" }, secondary: { label: "距離模式", min: 0, max: 1, step: 1, initial: 1, help: "0 使用曼哈頓距離，1 使用歐氏距離。" } },
  kmeans: { label: "K-Means", primary: { label: "群數 k", min: 2, max: 8, step: 1, initial: 4, help: "更多群不必然帶來更可執行的策略。" }, secondary: { label: "群組擴散程度", min: .3, max: 1.5, step: .05, initial: .8, help: "越高表示群組重疊越明顯。" } },
};

function extent(points: ExperimentPoint[], key: "x" | "y") {
  const values = points.map((point) => point[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min || 1) * .08;
  return [min - pad, max + pad] as const;
}

function ExperimentChart({ result }: { result: ExperimentResponse }) {
  const all = [...result.points, ...result.surface, ...result.centroids];
  const [minX, maxX] = extent(all, "x");
  const [minY, maxY] = extent(all, "y");
  const x = (value: number) => 30 + ((value - minX) / (maxX - minX)) * 740;
  const y = (value: number) => 390 - ((value - minY) / (maxY - minY)) * 350;
  const regression = result.model === "ridge";
  const line = regression ? [...result.points].sort((a, b) => a.x - b.x).map((point, index) => `${index ? "L" : "M"}${x(point.x)},${y(point.prediction ?? point.y)}`).join(" ") : "";
  const colors = ["#c2410c", "#f59e0b", "#7c2d12", "#fb923c", "#a16207", "#e11d48", "#65a30d", "#9a3412"];

  return <svg className="experiment-chart" viewBox="0 0 800 420" role="img" aria-label={`${result.title} 視覺化`}>
    <title>{result.title}</title>
    {[0, 1, 2, 3, 4].map((tick) => <g key={tick}><line className="chart-grid" x1="30" x2="770" y1={40 + tick * 87.5} y2={40 + tick * 87.5} /><line className="chart-grid" y1="40" y2="390" x1={30 + tick * 185} x2={30 + tick * 185} /></g>)}
    {result.surface.map((point, index) => <rect key={`s-${index}`} x={x(point.x) - 5} y={y(point.y) - 5} width="10" height="10" fill={point.prediction === 1 ? "#fed7aa" : "#fff7ed"} opacity=".82" />)}
    {regression && <path className="chart-line" d={line} />}
    {result.points.map((point, index) => <circle className="chart-point" key={`p-${index}`} cx={x(point.x)} cy={y(point.y)} r={regression ? 3.5 : 4.2} fill={colors[(point.label ?? 0) % colors.length]} opacity={point.prediction !== undefined && point.label !== null && point.prediction !== point.label ? .42 : .88} />)}
    {result.centroids.map((point, index) => <circle className="chart-centroid" key={`c-${index}`} cx={x(point.x)} cy={y(point.y)} r="9" />)}
  </svg>;
}

function formatValue(value: number) { return Number.isInteger(value) ? String(value) : value.toFixed(value < 1 ? 2 : 1); }

export function LabWorkbench({ initialModel }: { initialModel: string }) {
  const [model, setModel] = useState<LabId>(initialModel as LabId);
  const [primary, setPrimary] = useState(configs[initialModel as LabId].primary.initial);
  const [secondary, setSecondary] = useState(configs[initialModel as LabId].secondary.initial);
  const [result, setResult] = useState<ExperimentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const config = configs[model];

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const next = await fetchExperiment(model, primary, secondary);
        if (active) setResult(next);
      } catch {
        if (active) setError("實驗 API 無法回應，請確認 FastAPI 已啟動。");
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [model, primary, secondary]);

  function chooseModel(next: LabId) {
    setModel(next);
    setPrimary(configs[next].primary.initial);
    setSecondary(configs[next].secondary.initial);
    window.history.replaceState(null, "", `/lab?model=${next}`);
  }

  const aiContext = useMemo(() => ({ page: "parameter-lab", industry: result?.industry_note ?? null, model, parameters: result?.parameters ?? {}, metrics: result?.metrics ?? {}, diagnostic_codes: result?.diagnostic_codes ?? [] }), [model, result]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ml-ai-context", {
      detail: { ...aiContext, page: window.location.pathname },
    }));
  }, [aiContext]);

  return <div className="page-shell inner-page">
    <div className="lab-heading"><div><span>PARAMETER LAB</span><h1>調整參數，觀察模型行為與業務代價</h1><p>所有資料均為固定種子的模擬評估；沒有任意程式執行或檔案上傳。重點是理解複雜度、泛化、門檻與營運限制的關係。</p></div><div className="lab-status"><RefreshCw size={13} /> 即時計算 FastAPI + scikit-learn</div></div>
    <div className="lab-tabs" role="tablist" aria-label="選擇參數實驗">{(Object.entries(configs) as [LabId, LabConfig][]).map(([id, item]) => <button type="button" role="tab" aria-selected={model === id} className={model === id ? "active" : ""} onClick={() => chooseModel(id)} key={id}>{item.label}</button>)}</div>
    <div className="lab-layout">
      <aside className="lab-control"><h2>實驗控制</h2>
        <div className="slider-group"><div className="slider-head"><label htmlFor="primary">{config.primary.label}</label><output>{formatValue(primary)}</output></div><input id="primary" type="range" min={config.primary.min} max={config.primary.max} step={config.primary.step} value={primary} onChange={(e) => setPrimary(Number(e.target.value))} /><div className="slider-scale"><span>{config.primary.min}</span><span>{config.primary.max}</span></div><p>{config.primary.help}</p></div>
        <div className="slider-group"><div className="slider-head"><label htmlFor="secondary">{config.secondary.label}</label><output>{formatValue(secondary)}</output></div><input id="secondary" type="range" min={config.secondary.min} max={config.secondary.max} step={config.secondary.step} value={secondary} onChange={(e) => setSecondary(Number(e.target.value))} /><div className="slider-scale"><span>{config.secondary.min}</span><span>{config.secondary.max}</span></div><p>{config.secondary.help}</p></div>
        <div className="control-note">圖表只呈現二維簡化資料，適合學習參數方向；不能取代真實資料的交叉驗證、偏誤檢查與成本評估。</div>
      </aside>
      <div className="lab-main">
        <section className="lab-visual"><div className="lab-visual-header"><h2>{result?.title ?? config.label}</h2><span>錯誤分類點會以較淡的顏色呈現</span></div>{loading && !result ? <div className="loading-visual">正在建立可重現實驗...</div> : result ? <ExperimentChart result={result} /> : <div className="loading-visual">沒有可顯示的資料</div>}{result && <div className="metric-grid">{Object.entries(result.metrics).map(([key, value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><strong>{value.toFixed(3)}</strong></div>)}</div>}{error && <div className="error-banner" role="alert">{error}</div>}</section>
        {result && <div className="insight-grid"><section className="lab-insight"><h3>這次變化代表什麼</h3><ul>{result.explanation.map((item) => <li key={item}>{item}</li>)}</ul><div>{result.diagnostic_codes.map((code) => <span className="diagnostic-code" key={code}>{code}</span>)}</div></section><section className="lab-insight"><h3>業界判讀</h3><p>{result.industry_note}</p><p>不要只挑目前分數最高的設定；還要確認穩定度、推論成本、人工處理量與規則是否能被使用者接受。</p></section></div>}
      </div>
    </div>
  </div>;
}
