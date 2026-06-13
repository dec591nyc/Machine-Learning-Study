import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical, TriangleAlert } from "@/components/icons";

import { modelBySlug, models } from "@/lib/models";

export function generateStaticParams() { return models.map((model) => ({ slug: model.slug })); }

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = modelBySlug.get(slug);
  if (!model) notFound();
  return (
    <div className="page-shell inner-page">
      <Link className="back-link" href="/models"><ArrowLeft size={17} />返回模型圖鑑</Link>
      <section className="model-detail-hero"><div><span className="eyebrow">{model.number} / {model.family}</span><h1>{model.name}</h1><p className="large-english">{model.english}</p><p>{model.summary}</p></div><div className="model-scorecard"><div><span>可解釋性</span><strong>{model.interpretability}</strong></div><div><span>訓練成本</span><strong>{model.trainingCost}</strong></div><div><span>必要前處理</span><strong>{model.preprocessing}</strong></div></div></section>
      <div className="detail-grid">
        <section className="detail-panel"><h2><CheckCircle2 size={21} />適合使用</h2>{model.bestFor.map((item) => <p key={item}>{item}</p>)}</section>
        <section className="detail-panel warning"><h2><TriangleAlert size={21} />何時不要用</h2>{model.avoidWhen.map((item) => <p key={item}>{item}</p>)}</section>
        <section className="detail-panel"><h2>重要參數</h2>{model.parameters.map((item) => <span className="token" key={item}>{item}</span>)}</section>
        <section className="detail-panel"><h2>評估與監控</h2>{model.metrics.map((item) => <span className="token" key={item}>{item}</span>)}</section>
      </div>
      <section className="industry-workflow"><div><span>模擬業界情境</span><h2>{model.industry}</h2></div><ol><li><strong>定義決策</strong><p>確認誰使用結果、何時產生、錯誤成本與處理容量。</p></li><li><strong>建立基準</strong><p>先與規則或簡單模型比較，不直接追求複雜度。</p></li><li><strong>驗證部署</strong><p>依時間與族群驗證，監控資料、模型與最終業務成果。</p></li></ol></section>
      {model.lab && <Link className="lab-cta" href={`/lab?model=${model.lab}`}><FlaskConical size={22} /><span><strong>開啟 {model.name} 參數實驗</strong><small>直接觀察參數如何改變模型行為</small></span><ArrowRight size={21} /></Link>}
    </div>
  );
}
