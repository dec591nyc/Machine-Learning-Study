from typing import Literal

from pydantic import BaseModel, Field


ModelId = Literal["ridge", "logistic", "decision-tree", "svm", "knn", "kmeans"]


class RecommendationRequest(BaseModel):
    task: Literal["regression", "classification", "clustering", "reduction"]
    data_type: Literal["tabular", "text", "image", "high-dimensional"] = "tabular"
    sample_size: Literal["small", "medium", "large"] = "medium"
    explainability: Literal["low", "medium", "high"] = "medium"
    class_imbalance: bool = False
    latency_sensitive: bool = False


class RecommendationResponse(BaseModel):
    baseline: str
    comparison: str
    reasons: list[str]
    risks: list[str]
    metrics: list[str]
    suggested_lab: ModelId | None = None


class ExperimentRequest(BaseModel):
    model: ModelId
    seed: int = Field(default=42, ge=0, le=9999)
    primary: float = Field(default=1.0)
    secondary: float = Field(default=0.5)


class Point(BaseModel):
    x: float
    y: float
    label: int | None = None
    prediction: float | int | None = None


class ExperimentResponse(BaseModel):
    model: ModelId
    title: str
    parameters: dict[str, float | int | str]
    metrics: dict[str, float]
    points: list[Point]
    surface: list[Point] = Field(default_factory=list)
    centroids: list[Point] = Field(default_factory=list)
    diagnostic_codes: list[str]
    explanation: list[str]
    industry_note: str


class AiContext(BaseModel):
    page: str
    industry: str | None = None
    model: str | None = None
    parameters: dict[str, float | int | str] = Field(default_factory=dict)
    metrics: dict[str, float] = Field(default_factory=dict)
    diagnostic_codes: list[str] = Field(default_factory=list)


class AiMessage(BaseModel):
    role: Literal["user", "model"]
    content: str = Field(min_length=1, max_length=800)


class AiAskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    context: AiContext
    history: list[AiMessage] = Field(default_factory=list, max_length=6)


class AiAskResponse(BaseModel):
    answer: str
    model: str
