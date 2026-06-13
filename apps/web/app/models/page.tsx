import { ModelCard } from "@/components/model-card";
import { models } from "@/lib/models";

export default function ModelsPage() {
  return <div className="page-shell inner-page"><div className="page-intro"><span>MODEL TOOLBOX</span><h1>十大模型實務圖鑑</h1><p>每一頁聚焦輸入、輸出、參數、評估與業界限制；有明確視覺效果的模型才提供互動模擬。</p></div><div className="model-grid">{models.map((model) => <ModelCard key={model.slug} model={model} />)}</div></div>;
}
