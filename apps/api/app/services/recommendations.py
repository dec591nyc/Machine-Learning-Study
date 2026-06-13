from app.schemas import RecommendationRequest, RecommendationResponse


def recommend(request: RecommendationRequest) -> RecommendationResponse:
    if request.task == "regression":
        baseline = "線性／Ridge 回歸"
        comparison = "隨機森林回歸"
        lab = "ridge"
        reasons = ["先用透明基準量化方向與誤差", "再確認非線性是否帶來穩定提升"]
        risks = ["極端值與區域差異可能被整體平均掩蓋"]
        metrics = ["MAE", "RMSE", "分族群誤差"]
    elif request.task == "clustering":
        baseline = "K-Means"
        comparison = "階層式或密度式分群"
        lab = "kmeans"
        reasons = ["可快速建立客群或運轉型態的第一版分群", "質心與群組輪廓容易向業務說明"]
        risks = ["尺度、離群值與群組形狀會影響結果", "群組必須能對應不同策略"]
        metrics = ["Silhouette", "群組穩定度", "可行動性"]
    elif request.task == "reduction":
        baseline = "PCA"
        comparison = "保留原始特徵的正則化模型"
        lab = None
        reasons = ["可壓縮高度相關特徵並檢查主要變異方向"]
        risks = ["低變異方向仍可能包含重要少數訊號", "主成分降低直接解釋性"]
        metrics = ["累積解釋變異", "下游模型表現", "推論成本"]
    elif request.data_type == "text":
        baseline = "單純貝氏"
        comparison = "正則化線性分類器"
        lab = None
        reasons = ["高維稀疏文字可快速建立穩定基準"]
        risks = ["複雜語境與詞序資訊不足", "詞彙漂移需監控"]
        metrics = ["Macro F1", "PR-AUC", "低信心轉人工比例"]
    elif request.explainability == "high":
        baseline = "邏輯回歸"
        comparison = "淺層決策樹"
        lab = "logistic"
        reasons = ["係數方向與風險分數較容易稽核", "淺樹可補充非線性規則"]
        risks = ["交互作用與非線性可能不足", "機率仍需校準"]
        metrics = ["PR-AUC", "Recall", "Calibration"]
    elif request.sample_size == "small":
        baseline = "邏輯回歸"
        comparison = "SVM"
        lab = "svm"
        reasons = ["樣本有限時先控制模型容量", "SVM 可測試清楚但非線性的邊界"]
        risks = ["切分變異大，需交叉驗證", "特徵尺度必須一致"]
        metrics = ["Cross-validation F1", "PR-AUC", "推論延遲"]
    else:
        baseline = "邏輯回歸"
        comparison = "決策樹／隨機森林"
        lab = "decision-tree"
        reasons = ["先建立可解釋分類基準", "再測試非線性與特徵交互作用"]
        risks = ["類別不平衡時 accuracy 會誤導", "樹模型可能過度擬合"]
        metrics = ["PR-AUC", "Precision@capacity", "Recall"]

    if request.class_imbalance:
        risks.append("正類稀少，門檻需依人工容量與漏報成本設定")
    if request.latency_sensitive:
        reasons.append("優先選擇推論延遲可控制的基準模型")
        metrics.append("p95 latency")

    return RecommendationResponse(
        baseline=baseline,
        comparison=comparison,
        reasons=reasons,
        risks=risks,
        metrics=metrics,
        suggested_lab=lab,
    )
