from pydantic import BaseModel
from typing import Literal, Optional


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
    prediction: Optional[str] = None
    prediction_detail: Optional[str] = None
    dismissed: bool = False
    created_at: Optional[str] = None


class ActionItemResponse(BaseModel):
    id: str
    insight_id: str
    dataset_id: str
    title: str
    description: str
    priority: str
    effort: str
    category: str
    added_to_plan: bool = False
    created_at: Optional[str] = None


class AddToPlanRequest(BaseModel):
    action_ids: list[str]


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


class RunGraphSimulationRequest(BaseModel):
    template_id: str
    template_name: str
    node_params: dict[str, dict[str, float]]
    node_structure: list[dict]
    edge_structure: list[dict]
    dataset_id: Optional[str] = None
    node_context: Optional[dict[str, dict[str, str]]] = None  # node_id -> { user_message, claude_reply }


class NodeContextRequest(BaseModel):
    node_label: str
    node_type: str  # source | modifier | sink
    user_message: str


class NodeContextResponse(BaseModel):
    reply: str


class PostAgenticArtifactRequest(BaseModel):
    type: str  # executive_one_pager | slack_update | email | pdf | jira_ticket | prd | meeting_agenda


# Copilot schemas
class CopilotClassifyRequest(BaseModel):
    prompt: str
    dataset_id: Optional[str] = None
    current_route: Optional[str] = None


class CopilotClassifyResponse(BaseModel):
    intent: Literal["navigate", "quick_answer", "generate_insight", "run_simulation"]
    confidence: float
    route: Optional[str] = None
    refined_prompt: Optional[str] = None
    focus_area: Optional[str] = None
    simulation_focus: Optional[str] = None


class CopilotInsightRequest(BaseModel):
    prompt: str
    dataset_id: str
    focus_area: Optional[str] = None


class CopilotQuickAnswerRequest(BaseModel):
    prompt: str
    dataset_id: Optional[str] = None
