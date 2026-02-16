# Prism 

**The "Cursor for Product Managers"**

Prism is the first AI-native system for product discovery. While coding agents like Cursor solve *how* to build software, Prism solves the harder problem: deciding *what* to build.

Built for the **Anthropic Claude Code Hackathon** (Feb 2026).

## 🚀 The Problem

Every successful product requires understanding markets, synthesizing feedback, and prioritizing features. Today, this process is manual, disconnected, and buried in spreadsheets. 

Prism changes that. It ingests your customer interviews, usage data, and support tickets to answer "What should we build next?"—not with vague suggestions, but with rigorous, data-backed simulations.

## ✨ Key Features

- **🔍 Multi-Source Ingestion**: Upload data of customer usage, feedback, and CRM data.
- **🧠 Agentic Insights**: Opus 4.6 proactively identifies churn risks, growth opportunities, and correlations without you asking.
- **📈 Market Simulations**: Run Monte Carlo simulations on strategic decisions (e.g., "Raise Enterprise Pricing") with confidence intervals.
- **🔮 Agentic Scenarios**: The AI generates, parameterizes, and compares multiple futures to recommend the best path.
- **📝 Artifact Generation**: One-click generation of PRDs, Linear tickets, and spec docs based on the chosen strategy.
- **Transparency**: Watch the "Reasoning Panel" to see the AI's step-by-step logic, building trust in the output.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts/Nivo
- **Backend**: FastAPI, Python 3.11+, SQLite (WAL mode)
- **AI**: Anthropic Opus 4.6 (Reasoning/Analysis), Sonnet 3.5 (Fast Tasks)
- **Infrastructure**: Docker Compose (optional)

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Anthropic API Key

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/prism.git
cd prism
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Run the App

You can run the full stack with one command if you have Docker:

```bash
docker-compose up --build
```

Or run services individually:

**Backend (Terminal 1):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.

## 📚 Documentation

- [Demo Guide](demo-guide.md) - Step-by-step walkthrough of the hackathon demo flow.
- [Architecture](CLAUDE.md) - Detailed technical breakdown.

## 🏆 Hackathon Details

This project was built during the Claude Code Hackathon to explore the capabilities of **Opus 4.6**. I leveraged its extended thinking windows for complex market simulation and agentic planning.

---

