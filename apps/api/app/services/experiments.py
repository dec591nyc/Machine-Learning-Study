from __future__ import annotations

import math

import numpy as np
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs, make_classification, make_moons, make_regression
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, r2_score, silhouette_score
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from app.schemas import ExperimentRequest, ExperimentResponse, Point


def _round(value: float) -> float:
    return round(float(value), 4)


def _classification_points(x: np.ndarray, y: np.ndarray, pred: np.ndarray) -> list[Point]:
    return [
        Point(x=_round(row[0]), y=_round(row[1]), label=int(label), prediction=int(p))
        for row, label, p in zip(x, y, pred, strict=True)
    ]


def _surface(model, x: np.ndarray, steps: int = 28) -> list[Point]:
    x_min, x_max = x[:, 0].min() - 0.6, x[:, 0].max() + 0.6
    y_min, y_max = x[:, 1].min() - 0.6, x[:, 1].max() + 0.6
    xx, yy = np.meshgrid(np.linspace(x_min, x_max, steps), np.linspace(y_min, y_max, steps))
    grid = np.column_stack([xx.ravel(), yy.ravel()])
    prediction = model.predict(grid)
    return [
        Point(x=_round(row[0]), y=_round(row[1]), prediction=int(pred))
        for row, pred in zip(grid, prediction, strict=True)
    ]


def _classification_data(seed: int, moons: bool = True):
    if moons:
        x, y = make_moons(n_samples=220, noise=0.27, random_state=seed)
    else:
        x, y = make_classification(
            n_samples=240,
            n_features=2,
            n_redundant=0,
            n_informative=2,
            class_sep=1.1,
            random_state=seed,
        )
    return train_test_split(x, y, test_size=0.32, random_state=seed, stratify=y)


def run_experiment(request: ExperimentRequest) -> ExperimentResponse:
    runners = {
        "ridge": _run_ridge,
        "logistic": _run_logistic,
        "decision-tree": _run_tree,
        "svm": _run_svm,
        "knn": _run_knn,
        "kmeans": _run_kmeans,
    }
    return runners[request.model](request)


def _run_ridge(request: ExperimentRequest) -> ExperimentResponse:
    alpha = float(np.clip(request.primary, 0.0, 30.0))
    noise = float(np.clip(request.secondary, 0.05, 1.0)) * 35
    x, y = make_regression(n_samples=150, n_features=1, noise=noise, random_state=request.seed)
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.3, random_state=request.seed)
    model = make_pipeline(StandardScaler(), Ridge(alpha=alpha))
    model.fit(x_train, y_train)
    prediction = model.predict(x_test)
    ordered = np.argsort(x[:, 0])
    full_prediction = model.predict(x)
    points = [
        Point(x=_round(x[index, 0]), y=_round(y[index]), prediction=_round(full_prediction[index]))
        for index in ordered
    ]
    diagnostic = "high_bias" if alpha > 15 else "stable_baseline" if alpha > 1 else "low_regularization"
    return ExperimentResponse(
        model="ridge",
        title="房價估值的正則化基準",
        parameters={"alpha": _round(alpha), "noise": _round(noise)},
        metrics={"mae": _round(mean_absolute_error(y_test, prediction)), "r2": _round(r2_score(y_test, prediction))},
        points=points,
        diagnostic_codes=[diagnostic],
        explanation=[
            "alpha 越大，係數被壓縮得越明顯，模型通常更穩定但可能欠擬合。",
            "資料雜訊增加時，單看 R² 不足，需同步觀察實際單位的 MAE。",
        ],
        industry_note="適合作為房價、需求與能耗預測的透明基準，再與非線性模型比較。",
    )


def _run_logistic(request: ExperimentRequest) -> ExperimentResponse:
    c_value = float(np.clip(request.primary, 0.05, 20.0))
    threshold = float(np.clip(request.secondary, 0.1, 0.9))
    x_train, x_test, y_train, y_test = _classification_data(request.seed, moons=False)
    model = make_pipeline(StandardScaler(), LogisticRegression(C=c_value, max_iter=500, random_state=request.seed))
    model.fit(x_train, y_train)
    probability = model.predict_proba(x_test)[:, 1]
    prediction = (probability >= threshold).astype(int)
    recall = ((prediction == 1) & (y_test == 1)).sum() / max((y_test == 1).sum(), 1)
    precision = ((prediction == 1) & (y_test == 1)).sum() / max((prediction == 1).sum(), 1)
    return ExperimentResponse(
        model="logistic",
        title="金融風控門檻與人工審查量",
        parameters={"C": _round(c_value), "threshold": _round(threshold)},
        metrics={"accuracy": _round(accuracy_score(y_test, prediction)), "precision": _round(precision), "recall": _round(recall), "flagged_rate": _round(prediction.mean())},
        points=_classification_points(x_test, y_test, prediction),
        surface=_surface(model, x_test),
        diagnostic_codes=["high_recall" if threshold < 0.4 else "high_precision" if threshold > 0.65 else "balanced_threshold"],
        explanation=[
            "降低門檻會增加被標記案件與 recall，也會提高人工審查量。",
            "C 越小代表正則化越強，決策邊界會更保守。",
        ],
        industry_note="業界通常依每日覆核容量選擇門檻，而不是固定使用 0.5。",
    )


def _run_tree(request: ExperimentRequest) -> ExperimentResponse:
    depth = int(np.clip(round(request.primary), 1, 12))
    leaf = int(np.clip(round(request.secondary), 1, 25))
    x_train, x_test, y_train, y_test = _classification_data(request.seed)
    model = DecisionTreeClassifier(max_depth=depth, min_samples_leaf=leaf, random_state=request.seed)
    model.fit(x_train, y_train)
    train_prediction = model.predict(x_train)
    test_prediction = model.predict(x_test)
    gap = accuracy_score(y_train, train_prediction) - accuracy_score(y_test, test_prediction)
    diagnostic = "possible_overfitting" if gap > 0.1 else "possible_underfitting" if accuracy_score(y_train, train_prediction) < 0.8 else "balanced_complexity"
    return ExperimentResponse(
        model="decision-tree",
        title="製程風險規則的複雜度",
        parameters={"max_depth": depth, "min_samples_leaf": leaf},
        metrics={"train_accuracy": _round(accuracy_score(y_train, train_prediction)), "validation_accuracy": _round(accuracy_score(y_test, test_prediction)), "generalization_gap": _round(gap)},
        points=_classification_points(x_test, y_test, test_prediction),
        surface=_surface(model, x_test),
        diagnostic_codes=[diagnostic],
        explanation=[
            "深度增加會形成更細碎的規則，訓練分數常上升，但驗證表現可能下降。",
            "提高葉節點最小樣本數能抑制只服務少數樣本的規則。",
        ],
        industry_note="製程規則必須穩定且可由工程師覆核，不應只追求訓練集準確率。",
    )


def _run_svm(request: ExperimentRequest) -> ExperimentResponse:
    c_value = float(np.clip(request.primary, 0.05, 30.0))
    gamma = float(np.clip(request.secondary, 0.03, 5.0))
    x_train, x_test, y_train, y_test = _classification_data(request.seed)
    model = make_pipeline(StandardScaler(), SVC(C=c_value, gamma=gamma, kernel="rbf"))
    model.fit(x_train, y_train)
    prediction = model.predict(x_test)
    svc = model.named_steps["svc"]
    return ExperimentResponse(
        model="svm",
        title="高維訊號的邊界複雜度",
        parameters={"C": _round(c_value), "gamma": _round(gamma)},
        metrics={"accuracy": _round(accuracy_score(y_test, prediction)), "support_vector_ratio": _round(len(svc.support_) / len(x_train))},
        points=_classification_points(x_test, y_test, prediction),
        surface=_surface(model, x_test),
        diagnostic_codes=["complex_boundary" if gamma > 1.2 else "smooth_boundary"],
        explanation=["gamma 越高，單一樣本影響範圍越小，邊界可能變得碎裂。", "C 越高，模型越不願意容忍訓練錯誤。"],
        industry_note="IC 測試與頻譜資料使用 SVM 時，尺度與推論成本都必須納入評估。",
    )


def _run_knn(request: ExperimentRequest) -> ExperimentResponse:
    neighbors = int(np.clip(round(request.primary), 1, 35))
    power = 1 if request.secondary < 0.5 else 2
    x_train, x_test, y_train, y_test = _classification_data(request.seed)
    model = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=neighbors, weights="distance", p=power))
    model.fit(x_train, y_train)
    prediction = model.predict(x_test)
    return ExperimentResponse(
        model="knn",
        title="相似案例判斷的鄰居數",
        parameters={"k": neighbors, "distance_power": power},
        metrics={"accuracy": _round(accuracy_score(y_test, prediction)), "f1": _round(f1_score(y_test, prediction))},
        points=_classification_points(x_test, y_test, prediction),
        surface=_surface(model, x_test),
        diagnostic_codes=["local_noise_risk" if neighbors < 5 else "over_smoothed" if neighbors > 25 else "local_balance"],
        explanation=["k 太小容易追隨局部雜訊，k 太大會把不同區域過度平均。", "距離定義會直接影響哪些歷史案例被視為相似。"],
        industry_note="零售推薦或維修案例檢索必須先確認相似度真的符合業務意義。",
    )


def _run_kmeans(request: ExperimentRequest) -> ExperimentResponse:
    clusters = int(np.clip(round(request.primary), 2, 8))
    spread = float(np.clip(request.secondary, 0.3, 1.5))
    x, _ = make_blobs(n_samples=240, centers=4, cluster_std=spread, random_state=request.seed)
    model = KMeans(n_clusters=clusters, n_init=12, random_state=request.seed)
    labels = model.fit_predict(x)
    silhouette = silhouette_score(x, labels) if len(set(labels)) > 1 else math.nan
    points = [Point(x=_round(row[0]), y=_round(row[1]), label=int(label), prediction=int(label)) for row, label in zip(x, labels, strict=True)]
    centroids = [Point(x=_round(row[0]), y=_round(row[1]), label=index) for index, row in enumerate(model.cluster_centers_)]
    return ExperimentResponse(
        model="kmeans",
        title="會員分群的群數與可行動性",
        parameters={"k": clusters, "cluster_spread": _round(spread)},
        metrics={"silhouette": _round(silhouette), "inertia_per_sample": _round(model.inertia_ / len(x))},
        points=points,
        centroids=centroids,
        diagnostic_codes=["too_many_segments" if clusters > 5 else "coarse_segments" if clusters < 4 else "candidate_segments"],
        explanation=["增加群數一定會降低群內誤差，但不代表營運上更有價值。", "應同時確認群組穩定度、規模與是否能採取不同策略。"],
        industry_note="會員分群的成功標準是能形成不同營運策略，不只是 silhouette 分數高。",
    )
