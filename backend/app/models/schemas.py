from pydantic import BaseModel
from typing import Optional


class DatasetResponse(BaseModel):
    id: str
    name: str
    filename: str
    row_count: Optional[int] = None
    columns: Optional[list[str]] = None
    created_at: Optional[str] = None


class DatasetDetailResponse(DatasetResponse):
    sample_rows: list[dict] = []
    schema_info: Optional[dict] = None


class UploadResponse(BaseModel):
    dataset: DatasetResponse
    preview: list[dict]
    columns: list[str]
    row_count: int


class InsightResponse(BaseModel):
    id: str
    dataset_id: str
    type: str
    priority: str
    title: str
    description: str
    impact_revenue: Optional[float] = None
    impact_customers: Optional[int] = None
    confidence: Optional[float] = None
    chart_data: Optional[dict] = None
    ai_reasoning: Optional[str] = None
    impact_score: Optional[float] = None
    suggested_questions: Optional[list[str]] = None
    dismissed: bool = False
    created_at: Optional[str] = None


class ExpandInsightResponse(BaseModel):
    insight_id: str
    ai_reasoning: str


class SimulationRequest(BaseModel):
    dataset_id: str
    feature_name: str
    parameters: Optional[dict] = None


class SimulationResponse(BaseModel):
    id: str
    dataset_id: str
    feature_name: str
    parameters: dict
    results: dict
    recommendation: Optional[str] = None
    confidence: Optional[float] = None
    created_at: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    title: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    thinking: Optional[list[str]] = None
    pinned_context: Optional[list[str]] = None
    created_at: Optional[str] = None


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []


class SendMessageRequest(BaseModel):
    content: str
    pinned_context: Optional[list[str]] = None


class CreateConversationRequest(BaseModel):
    title: Optional[str] = None
