import { LabWorkbench } from "@/components/lab-workbench";

const allowed = new Set(["ridge", "logistic", "decision-tree", "svm", "knn", "kmeans"]);

export default async function LabPage({ searchParams }: { searchParams: Promise<{ model?: string }> }) {
  const { model } = await searchParams;
  const initialModel = model && allowed.has(model) ? model : "decision-tree";
  return <LabWorkbench initialModel={initialModel} />;
}
