from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import AiAskRequest, AiAskResponse, AiContext, ExperimentRequest, ExperimentResponse, RecommendationRequest, RecommendationResponse
from app.services.experiments import run_experiment
from app.services.gemini import GeminiNotConfiguredError, GeminiServiceError, ask_gemini
from app.services.recommendations import recommend


app = FastAPI(
    title="Machine Learning Study API",
    version="0.2.0",
    description="Bounded model experiments and transparent recommendation rules.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ml-study-api"}


@app.post("/api/recommendations", response_model=RecommendationResponse)
def recommendations(request: RecommendationRequest) -> RecommendationResponse:
    return recommend(request)


@app.post("/api/experiments", response_model=ExperimentResponse)
def experiments(request: ExperimentRequest) -> ExperimentResponse:
    return run_experiment(request)


@app.post("/api/ai/context", response_model=AiContext)
def validate_ai_context(context: AiContext) -> AiContext:
    return context


@app.get("/api/ai/health")
def ai_health() -> dict[str, str | bool]:
    return {
        "status": "ready" if settings.gemini_configured else "not_configured",
        "configured": settings.gemini_configured,
        "model": settings.gemini_model,
    }


@app.post("/api/ai/ask", response_model=AiAskResponse)
def ai_ask(request: AiAskRequest) -> AiAskResponse:
    try:
        return ask_gemini(request, settings)
    except GeminiNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except GeminiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
