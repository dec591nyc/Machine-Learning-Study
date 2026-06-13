"use client";

import { useState } from "react";
import { models } from "@/lib/models";

const rows = [
  ["模型類型", (slug: string) => models.find((model) => model.slug === slug)?.family],
  ["適合情境", (slug: string) => models.find((model) => model.slug === slug)?.bestFor],
  ["不適合情境", (slug: string) => models.find((model) => model.slug === slug)?.avoidWhen],
  ["關鍵參數", (slug: string) => models.find((model) => model.slug === slug)?.parameters],
  ["評估指標", (slug: string) => models.find((model) => model.slug === slug)?.metrics],
  ["前處理", (slug: string) => models.find((model) => model.slug === slug)?.preprocessing],
  ["可解釋性", (slug: string) => models.find((model) => model.slug === slug)?.interpretability],
  ["訓練成本", (slug: string) => models.find((model) => model.slug === slug)?.trainingCost],
] as const;

export default function ComparePage() {
  const [selected, setSelected] = useState(["logistic-regression", "decision-tree", "random-forest"]);

  function toggle(slug: string) {
    setSelected((current) => current.includes(slug) ? current.filter((item) => item !== slug) : current.length < 3 ? [...current, slug] : current);
  }

  const selectedModels = selected.map((slug) => models.find((model) => model.slug === slug)).filter(Boolean);

  return (
    <div className="page-shell inner-page">
      <div className="page-intro"><span>MODEL COMPARISON</span><h1>比較的不只是分數，也包括使用成本</h1><p>最多選擇三個模型，從資料前處理、解釋性、參數與部署限制判斷哪個候選更符合實際工作。</p></div>
      <div className="compare-picker" aria-label="選擇比較模型">{models.map((model) => { const active = selected.includes(model.slug); return <button type="button" className={active ? "selected" : ""} aria-pressed={active} disabled={!active && selected.length >= 3} onClick={() => toggle(model.slug)} key={model.slug}>{model.name}</button>; })}</div>
      <p className="compare-note">已選 {selected.length} / 3。至少保留一個模型，建議把透明基準與複雜候選放在一起比較。</p>
      <div className="compare-table-wrap">
        <table className="compare-table"><thead><tr><th>比較面向</th>{selectedModels.map((model) => <th key={model!.slug}>{model!.name}<br /><small>{model!.english}</small></th>)}</tr></thead><tbody>{rows.map(([label, getter]) => <tr key={label}><td>{label}</td>{selectedModels.map((model) => { const value = getter(model!.slug); return <td key={model!.slug}>{Array.isArray(value) ? <ul>{value.map((item) => <li key={item}>{item}</li>)}</ul> : value}</td>; })}</tr>)}</tbody></table>
      </div>
    </div>
  );
}
