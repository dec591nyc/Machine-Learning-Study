import Link from "next/link";
import { ArrowRight, BookOpenText, Building2, ChartNoAxesCombined, Download, FlaskConical, ShieldCheck } from "@/components/icons";

import { ModelCard } from "@/components/model-card";
import { industries, models } from "@/lib/models";

export default function HomePage() {
  return (
    <div className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">TAIWAN INDUSTRY ML PRACTICE</span>
          <h1>從參數變化，看懂模型在業界如何做決策</h1>
          <p>不是模型名詞清單，而是一個把問題定義、模型選擇、參數影響與部署限制放在同一張工作台上的互動展示。</p>
          <div className="hero-actions">
            <Link className="button primary" href="/lab"><FlaskConical size={19} />開始參數實驗</Link>
            <Link className="button secondary" href="/selector">依問題選模型 <ArrowRight size={18} /></Link>
          </div>
          <div className="hero-proof"><span><ShieldCheck size={17} />固定資料與受限參數</span><span><ChartNoAxesCombined size={17} />同時比較訓練與驗證</span></div>
        </div>
        <div className="hero-panel" aria-label="決策樹參數影響摘要">
          <div className="panel-header"><span>模擬情境</span><strong>製程風險規則</strong></div>
          <div className="tree-preview">
            <div className="tree-node root">max_depth = 8</div>
            <div className="tree-branches"><div><span>訓練準確率</span><strong>0.99</strong></div><div><span>驗證準確率</span><strong>0.82</strong></div></div>
            <div className="diagnostic"><span>診斷</span><strong>可能過度擬合</strong><p>深度增加後規則變細，但新批次表現下降。</p></div>
          </div>
        </div>
      </section>

      <section className="section-block industry-section">
        <div className="section-heading"><span>INDUSTRY CASES</span><h2>先從業界決策理解模型</h2><p>所有案例分享都是基於模型特色推算企業採用情境。</p></div>
        <div className="industry-grid">
          {industries.map((industry, index) => (
            <article className="industry-card" key={industry.name}><span className="industry-index">0{index + 1}</span><Building2 size={24} /><h3>{industry.name}</h3><p>{industry.detail}</p><div>{industry.models.map((model) => <span key={model}>{model}</span>)}</div></article>
          ))}
        </div>
      </section>

      <section className="section-block warm-section">
        <div className="section-heading inline-heading"><div><span>MODEL TOOLBOX</span><h2>十大模型實務圖鑑</h2></div><Link href="/models">查看完整圖鑑 <ArrowRight size={17} /></Link></div>
        <div className="model-grid">{models.slice(0, 6).map((model) => <ModelCard key={model.slug} model={model} />)}</div>
      </section>

      <section className="resource-grid">
        <article><BookOpenText size={27} /><h2>二萬字實務教材</h2><p>從問題定義、指標、十大模型到部署監控，保留可下載的完整 PDF。</p><a href="/machine-learning-practical-study-guide-zh-TW.pdf" download><Download size={17} />下載 PDF</a></article>
        <article><ChartNoAxesCombined size={27} /><h2>資訊圖表</h2><p>快速回顧模型用途、可解釋性與台灣產業情境。</p><a href="/infographic.html" target="_blank">開啟資訊圖表 <ArrowRight size={17} /></a></article>
      </section>
    </div>
  );
}
