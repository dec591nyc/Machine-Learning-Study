import Link from "next/link";
import { ArrowUpRight, FlaskConical } from "@/components/icons";
import type { ModelInfo } from "@/lib/models";

export function ModelCard({ model }: { model: ModelInfo }) {
  return (
    <article className="model-card">
      <div className="model-card-top"><span className="model-number">{model.number}</span><span className="family-pill">{model.family}</span></div>
      <h3>{model.name}</h3><p className="model-english">{model.english}</p><p>{model.summary}</p>
      <div className="industry-line"><strong>業界情境</strong><span>{model.industry}</span></div>
      <div className="model-card-actions">
        <Link href={`/models/${model.slug}`}>實務頁 <ArrowUpRight size={16} /></Link>
        {model.lab && <Link href={`/lab?model=${model.lab}`}><FlaskConical size={16} />參數模擬</Link>}
      </div>
    </article>
  );
}
