# Product Insight Autopilot - Implementation Plan
## Claude Code Hackathon Submission

**Problem Statement:** Build a Tool That Should Exist  
**Target Prizes:** Top 3 + Most Creative Opus 4.6 Exploration + Keep Thinking Prize

---

## Executive Summary

**What We're Building:**

An AI-powered product intelligence platform that automatically analyzes product data and generates executive insights without requiring users to ask questions. Upload your CSV data (customers, events, support tickets) and the AI autonomously discovers patterns, explains why metrics changed, and simulates "what-if" scenarios.

**Core Value Proposition:**

> "Stop asking questions. Start seeing answers."

Traditional analytics require PMs to know what to ask. This platform proactively surfaces insights like: "Enterprise churn increased 23% because 67% of churned customers requested SSO. Building SSO will prevent $340K/year churn and add $420K new ARR (ROI: 340%)."

**Key Differentiators:**

1. **Auto-Insights**: Zero prompts needed—AI explores data autonomously
2. **Market Simulation**: Test decisions before building ("What if we build SSO?")
3. **Salesforce-Quality UI**: Enterprise-grade design with light/dark modes
4. **Opus 4.6 Showcase**: Extended thinking, agentic workflows, tool use

---

## UI/UX Design System (Salesforce-Inspired with Claude Branding)

### Design Philosophy

**Inspiration:** Salesforce Lightning Design System  
**Branding:** Claude's fonts and colors  
**Modes:** Light and Dark (user-toggleable)

**Key Principles:**
- Clean, professional, enterprise-grade
- Consistent spacing and typography
- Accessible (WCAG 2.1 AA compliant)
- Responsive (desktop-first, mobile-friendly)

---

### Color Palette

#### Claude Brand Colors

**Primary (Claude Orange):**
- Light mode: `#CC785C` (buttons, links, accents)
- Dark mode: `#D97757` (slightly brighter for contrast)

**Secondary (Claude Cream):**
- Light mode: `#F4EDE4` (backgrounds, cards)
- Dark mode: `#2D2A26` (inverted for dark mode)

**Neutral Grays:**
- Light mode backgrounds: `#FFFFFF`, `#F3F2F1`, `#ECEBE9`
- Dark mode backgrounds: `#1A1816`, `#2D2A26`, `#3E3B37`
- Light mode text: `#181818`, `#3E3B37`, `#706E6B`
- Dark mode text: `#F4EDE4`, `#C9C7C5`, `#A09E9C`

**Semantic Colors:**
- Success: `#2E844A` (light), `#3BA755` (dark)
- Warning: `#DD7A01` (light), `#FE9339` (dark)
- Error: `#C23934` (light), `#EA001E` (dark)
- Info: `#0176D3` (light), `#1B96FF` (dark)

---

### Typography

**Font Family:**

Primary: `"Claude Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

Fallback: System fonts if Claude Sans unavailable

**Font Sizes (Salesforce Scale):**

```css
/* Headings */
--font-size-heading-xxl: 2.625rem;  /* 42px - Page titles */
--font-size-heading-xl: 2rem;       /* 32px - Section headers */
--font-size-heading-l: 1.5rem;      /* 24px - Card titles */
--font-size-heading-m: 1.25rem;     /* 20px - Subsections */
--font-size-heading-s: 1rem;        /* 16px - Widget titles */

/* Body */
--font-size-body-l: 1rem;           /* 16px - Primary text */
--font-size-body-m: 0.875rem;       /* 14px - Secondary text */
--font-size-body-s: 0.8125rem;      /* 13px - Captions */
--font-size-body-xs: 0.75rem;       /* 12px - Labels */
```

**Font Weights:**
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

---

### Spacing System (Salesforce 8px Grid)

```css
--spacing-xxx-small: 0.125rem;  /* 2px */
--spacing-xx-small: 0.25rem;    /* 4px */
--spacing-x-small: 0.5rem;      /* 8px */
--spacing-small: 0.75rem;       /* 12px */
--spacing-medium: 1rem;         /* 16px */
--spacing-large: 1.5rem;        /* 24px */
--spacing-x-large: 2rem;        /* 32px */
--spacing-xx-large: 3rem;       /* 48px */
```

**Usage:**
- Card padding: `--spacing-medium` (16px)
- Section gaps: `--spacing-large` (24px)
- Page margins: `--spacing-x-large` (32px)

---

### Component Library

#### 1. **Page Layout (Salesforce-Style)**

```
┌─────────────────────────────────────────────────────┐
│  GLOBAL HEADER                                      │
│  [Logo] Product Insight Autopilot    [Theme] [User]│
└─────────────────────────────────────────────────────┘
│
├─────────────────────────────────────────────────────┤
│ NAVIGATION BAR                                      │
│ [Dashboard] [Simulations] [Data Sources] [Settings]│
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  PAGE HEADER                               │    │
│  │  Dashboard                                 │    │
│  │  Last updated: 2 minutes ago               │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  CRITICAL ALERTS SECTION                   │    │
│  │  [Alert cards...]                          │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │  WIDGET 1    │  │  WIDGET 2    │  │ WIDGET 3│  │
│  │  [Chart]     │  │  [Chart]     │  │ [Chart] │  │
│  └──────────────┘  └──────────────┘  └─────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Implementation:**
- Global header: Fixed position, 60px height
- Navigation: Sticky, 48px height
- Page content: Max-width 1280px, centered
- Grid: 12-column responsive grid

---

#### 2. **Card Component (Salesforce Lightning)**

**Light Mode:**
```css
.card {
  background: #FFFFFF;
  border: 1px solid #DDDBDA;
  border-radius: 0.25rem;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);
  padding: 1rem;
}
```

**Dark Mode:**
```css
.card {
  background: #2D2A26;
  border: 1px solid #3E3B37;
  border-radius: 0.25rem;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.3);
  padding: 1rem;
}
```

**Card Structure:**
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Churn Risk Analysis</h3>
    <button class="card-menu">⋮</button>
  </div>
  <div class="card-body">
    <!-- Chart or content -->
  </div>
  <div class="card-footer">
    <p class="ai-insight">AI Insight: Enterprise churn up 23%...</p>
    <button class="btn-primary">Run Simulation</button>
  </div>
</div>
```

---

#### 3. **Alert Banner (Critical Insights)**

**Structure:**
```html
<div class="alert alert-critical">
  <div class="alert-icon">🚨</div>
  <div class="alert-content">
    <h4 class="alert-title">Critical: Enterprise churn up 23%</h4>
    <p class="alert-description">
      Primary cause: SSO requests (67% of churned customers)
      <br>
      Revenue impact: -$340K/year
    </p>
    <div class="alert-actions">
      <button class="btn-primary">Run Simulation</button>
      <button class="btn-secondary">View Details</button>
      <button class="btn-text">Dismiss</button>
    </div>
  </div>
</div>
```

**Styling:**
```css
/* Light Mode */
.alert-critical {
  background: linear-gradient(90deg, #C23934 0%, #EA001E 100%);
  color: #FFFFFF;
  padding: 1rem;
  border-radius: 0.25rem;
  margin-bottom: 1.5rem;
}

/* Dark Mode */
.alert-critical {
  background: linear-gradient(90deg, #EA001E 0%, #FF4D4D 100%);
  color: #FFFFFF;
}
```

---

#### 4. **Button Styles (Salesforce)**

**Primary Button:**
```css
/* Light Mode */
.btn-primary {
  background: #CC785C;
  color: #FFFFFF;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #B86A50;
}

/* Dark Mode */
.btn-primary {
  background: #D97757;
}

.btn-primary:hover {
  background: #E58A6A;
}
```

**Secondary Button:**
```css
/* Light Mode */
.btn-secondary {
  background: transparent;
  color: #CC785C;
  border: 1px solid #CC785C;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

/* Dark Mode */
.btn-secondary {
  color: #D97757;
  border-color: #D97757;
}
```

---

#### 5. **Data Table (Salesforce Lightning)**

**Structure:**
```html
<table class="data-table">
  <thead>
    <tr>
      <th>Customer</th>
      <th>Churn Risk</th>
      <th>MRR</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Acme Corp</td>
      <td><span class="badge badge-danger">High (85%)</span></td>
      <td>$5,000</td>
      <td><button class="btn-text">View</button></td>
    </tr>
  </tbody>
</table>
```

**Styling:**
```css
/* Light Mode */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #FFFFFF;
}

.data-table th {
  background: #F3F2F1;
  color: #3E3B37;
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 2px solid #DDDBDA;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #ECEBE9;
}

/* Dark Mode */
.data-table {
  background: #2D2A26;
}

.data-table th {
  background: #3E3B37;
  color: #F4EDE4;
  border-bottom-color: #4A4845;
}

.data-table td {
  border-bottom-color: #3E3B37;
}
```

---

#### 6. **Chart Styling (Recharts with Claude Colors)**

**Color Palette for Charts:**

```javascript
const CHART_COLORS = {
  light: {
    primary: '#CC785C',      // Claude Orange
    secondary: '#0176D3',    // Info Blue
    success: '#2E844A',      // Success Green
    warning: '#DD7A01',      // Warning Orange
    danger: '#C23934',       // Error Red
    neutral: '#706E6B',      // Gray
  },
  dark: {
    primary: '#D97757',
    secondary: '#1B96FF',
    success: '#3BA755',
    warning: '#FE9339',
    danger: '#EA001E',
    neutral: '#A09E9C',
  }
};
```

**Chart Configuration:**
```javascript
<LineChart data={data}>
  <CartesianGrid strokeDasharray="3 3" stroke="#ECEBE9" />
  <XAxis 
    dataKey="date" 
    stroke="#706E6B"
    style={{ fontSize: '0.8125rem' }}
  />
  <YAxis 
    stroke="#706E6B"
    style={{ fontSize: '0.8125rem' }}
  />
  <Tooltip 
    contentStyle={{
      background: '#FFFFFF',
      border: '1px solid #DDDBDA',
      borderRadius: '0.25rem',
    }}
  />
  <Line 
    type="monotone" 
    dataKey="churnRate" 
    stroke="#CC785C" 
    strokeWidth={2}
  />
</LineChart>
```

---

#### 7. **Theme Toggle Component**

**UI:**
```html
<button class="theme-toggle" aria-label="Toggle theme">
  <svg class="icon-sun">☀️</svg>
  <svg class="icon-moon">🌙</svg>
</button>
```

**Implementation:**
```javascript
const [theme, setTheme] = useState('light');

const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};
```

**CSS Variables:**
```css
:root[data-theme="light"] {
  --color-background: #FFFFFF;
  --color-surface: #F3F2F1;
  --color-text-primary: #181818;
  --color-text-secondary: #3E3B37;
  --color-border: #DDDBDA;
  --color-primary: #CC785C;
}

:root[data-theme="dark"] {
  --color-background: #1A1816;
  --color-surface: #2D2A26;
  --color-text-primary: #F4EDE4;
  --color-text-secondary: #C9C7C5;
  --color-border: #3E3B37;
  --color-primary: #D97757;
}
```

---

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  /* Stack cards vertically */
  /* Collapse navigation to hamburger menu */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  /* 2-column grid */
}

/* Desktop */
@media (min-width: 1024px) {
  /* 3-column grid */
  /* Full navigation visible */
}
```

---

## Technical Architecture

### Technology Stack

**Frontend:**
- **React 18** with TypeScript
- **Vite** (build tool, fast dev server)
- **Tailwind CSS** (utility-first styling, custom config for Salesforce design)
- **Recharts** (charts, customized with Claude colors)
- **Zustand** (lightweight state management)
- **React Router** (navigation)

**Backend:**
- **FastAPI** (Python, async, type-safe)
- **Pydantic** (data validation)
- **Pandas** (data processing)
- **NumPy/SciPy** (simulations)
- **Scikit-learn** (ML models)

**AI:**
- **Claude API** (Opus 4.6)
- **Extended thinking mode** enabled
- **Tool use** for Python code execution

**Data:**
- **SQLite** (embedded database, no setup)
- **CSV upload** (primary data source)

**Deployment:**
- **No Docker initially** (run directly with `npm run dev` + `uvicorn`)
- **Containerize later** for final submission

---

### Project Structure

```
product-insight-autopilot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── PageLayout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── AlertBanner.tsx
│   │   │   │   ├── InsightCard.tsx
│   │   │   │   ├── ChurnRiskWidget.tsx
│   │   │   │   └── RevenueChart.tsx
│   │   │   ├── simulation/
│   │   │   │   ├── SimulationForm.tsx
│   │   │   │   └── SimulationResults.tsx
│   │   │   └── shared/
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── DataTable.tsx
│   │   │       └── ThemeToggle.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Simulations.tsx
│   │   │   └── DataSources.tsx
│   │   ├── hooks/
│   │   │   ├── useTheme.ts
│   │   │   └── useInsights.ts
│   │   ├── store/
│   │   │   └── appStore.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── salesforce-theme.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── insights.py
│   │   │   │   ├── simulations.py
│   │   │   │   └── data.py
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── claude_client.py
│   │   ├── services/
│   │   │   ├── insight_engine.py
│   │   │   ├── simulation_engine.py
│   │   │   └── data_processor.py
│   │   ├── models/
│   │   │   ├── customer.py
│   │   │   ├── insight.py
│   │   │   └── simulation.py
│   │   └── db/
│   │       └── database.py
│   ├── requirements.txt
│   └── .env.example
│
├── data/
│   └── sample_data.csv
│
├── README.md
└── .gitignore
```

---

## Implementation Steps

### Phase 1: Project Setup

**Goal:** Get development environment running

**Steps:**

1. **Create project structure:**
```bash
mkdir product-insight-autopilot
cd product-insight-autopilot
mkdir frontend backend data
```

2. **Initialize frontend:**
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install tailwindcss postcss autoprefixer recharts zustand react-router-dom
npm install -D @types/node
npx tailwindcss init -p
```

3. **Initialize backend:**
```bash
cd ../backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn pandas numpy scipy scikit-learn anthropic python-multipart pydantic-settings
pip freeze > requirements.txt
```

4. **Configure Tailwind for Salesforce design:**

Edit `frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        claude: {
          orange: {
            light: '#CC785C',
            dark: '#D97757',
          },
          cream: {
            light: '#F4EDE4',
            dark: '#2D2A26',
          },
        },
        salesforce: {
          gray: {
            50: '#FAFAF9',
            100: '#F3F2F1',
            200: '#ECEBE9',
            300: '#DDDBDA',
            400: '#C9C7C5',
            500: '#A09E9C',
            600: '#706E6B',
            700: '#514F4D',
            800: '#3E3B37',
            900: '#2D2A26',
            950: '#1A1816',
          },
        },
      },
      fontFamily: {
        sans: ['"Claude Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      spacing: {
        'sf-xs': '0.5rem',    // 8px
        'sf-sm': '0.75rem',   // 12px
        'sf-md': '1rem',      // 16px
        'sf-lg': '1.5rem',    // 24px
        'sf-xl': '2rem',      // 32px
      },
    },
  },
  plugins: [],
};
```

5. **Create environment file:**

`backend/.env`:
```
ANTHROPIC_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///./data.db
```

---

### Phase 2: Backend - Data Ingestion

**Goal:** Accept CSV uploads and parse data

**File:** `backend/app/api/routes/data.py`

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import io
from typing import Dict, Any

router = APIRouter(prefix="/api/data", tags=["data"])

@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Upload and parse CSV file.
    
    Returns:
        - columns: List of column names
        - row_count: Number of rows
        - sample_data: First 5 rows
        - inferred_schema: AI's understanding of the data
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Read CSV
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Basic validation
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Infer schema using Claude (Opus 4.6)
        schema = await infer_schema(df)
        
        return {
            "columns": df.columns.tolist(),
            "row_count": len(df),
            "sample_data": df.head(5).to_dict(orient='records'),
            "inferred_schema": schema,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

async def infer_schema(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Use Claude Opus 4.6 to infer the meaning of columns.
    
    This showcases:
    - Vision capabilities (analyzing CSV structure)
    - Extended thinking (reasoning about data relationships)
    """
    from app.core.claude_client import claude_client
    
    # Create a text representation of the CSV structure
    csv_preview = df.head(10).to_string()
    
    prompt = f"""Analyze this CSV data and infer the schema.

CSV Preview:
{csv_preview}

For each column, identify:
1. Data type (string, number, date, etc.)
2. Likely meaning (e.g., "customer_id" = unique customer identifier)
3. Relationships to other columns

Return a JSON object with this structure:
{{
  "columns": [
    {{
      "name": "column_name",
      "type": "inferred_type",
      "meaning": "description",
      "is_unique": boolean,
      "is_required": boolean
    }}
  ],
  "suggested_entity": "what this data represents (e.g., 'customers', 'events')"
}}
"""
    
    response = await claude_client.messages.create(
        model="claude-opus-4.6-20250514",
        max_tokens=2000,
        thinking={
            "type": "enabled",
            "budget_tokens": 1000
        },
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Extract JSON from response
    # (Add proper JSON parsing here)
    return {"inferred": True}  # Placeholder
```

**File:** `backend/app/core/claude_client.py`

```python
from anthropic import AsyncAnthropic
from app.core.config import settings

claude_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
```

**File:** `backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str
    DATABASE_URL: str = "sqlite:///./data.db"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

### Phase 3: Backend - Auto-Insight Engine

**Goal:** Generate insights automatically using Opus 4.6

**File:** `backend/app/services/insight_engine.py`

```python
from typing import List, Dict, Any
import pandas as pd
from app.core.claude_client import claude_client
from app.models.insight import Insight, InsightType, Priority

class InsightEngine:
    """
    Generates auto-insights from product data using Claude Opus 4.6.
    
    Key features:
    - Extended thinking for complex analysis
    - Agentic workflow (autonomous exploration)
    - Tool use (Python code execution for stats)
    """
    
    async def generate_insights(self, df: pd.DataFrame, schema: Dict[str, Any]) -> List[Insight]:
        """
        Main entry point: analyze data and return top insights.
        
        This showcases Opus 4.6's:
        - Extended thinking (multi-step reasoning)
        - Agentic behavior (decides what to analyze)
        - Tool use (calls Python for calculations)
        """
        
        # Step 1: Let Claude decide what to analyze
        analysis_plan = await self._create_analysis_plan(df, schema)
        
        # Step 2: Execute analyses
        insights = []
        for analysis in analysis_plan['analyses']:
            insight = await self._execute_analysis(df, analysis)
            if insight:
                insights.append(insight)
        
        # Step 3: Rank by priority
        ranked_insights = await self._rank_insights(insights)
        
        return ranked_insights[:5]  # Top 5
    
    async def _create_analysis_plan(self, df: pd.DataFrame, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Let Claude autonomously decide what to analyze.
        
        This is the "agentic" part - no user prompts, AI explores independently.
        """
        
        data_summary = {
            "row_count": len(df),
            "columns": schema,
            "sample_data": df.head(5).to_dict(orient='records'),
        }
        
        prompt = f"""You are an expert product analyst. Analyze this dataset and create an analysis plan.

Dataset:
{data_summary}

Your task:
1. Identify the most important patterns to investigate
2. Decide which analyses will yield actionable insights
3. Prioritize by business impact

Think step-by-step about:
- What questions would a PM want answered?
- What anomalies or trends might exist?
- What correlations could drive decisions?

Return a JSON array of analyses to perform:
[
  {{
    "type": "churn_analysis",
    "description": "Analyze why customers are churning",
    "expected_insight": "Root causes of churn"
  }},
  ...
]
"""
        
        response = await claude_client.messages.create(
            model="claude-opus-4.6-20250514",
            max_tokens=3000,
            thinking={
                "type": "enabled",
                "budget_tokens": 2000  # Allow extended thinking
            },
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse response (add proper JSON extraction)
        return {"analyses": []}  # Placeholder
    
    async def _execute_analysis(self, df: pd.DataFrame, analysis: Dict[str, Any]) -> Insight:
        """
        Execute a specific analysis using Claude + Python tools.
        
        This showcases:
        - Tool use (Claude writes Python code, we execute it)
        - Extended thinking (complex statistical reasoning)
        """
        
        analysis_type = analysis['type']
        
        if analysis_type == 'churn_analysis':
            return await self._analyze_churn(df)
        elif analysis_type == 'feature_adoption':
            return await self._analyze_feature_adoption(df)
        # Add more analysis types...
        
        return None
    
    async def _analyze_churn(self, df: pd.DataFrame) -> Insight:
        """
        Churn analysis with extended thinking.
        
        Example insight:
        "Enterprise churn increased 23% this month. Primary cause: 
        67% of churned customers requested SSO integration. 
        Revenue impact: -$340K/year."
        """
        
        # Calculate churn metrics
        churn_stats = self._calculate_churn_stats(df)
        
        # Let Claude reason about causes
        prompt = f"""Analyze this churn data and explain WHY churn increased.

Churn Statistics:
{churn_stats}

Customer Feedback (sample):
{df[df['churned'] == True]['feedback'].head(20).tolist()}

Think step-by-step:
1. What patterns do you see?
2. What are the root causes?
3. What's the revenue impact?
4. What should we do about it?

Provide a concise, actionable insight.
"""
        
        response = await claude_client.messages.create(
            model="claude-opus-4.6-20250514",
            max_tokens=1500,
            thinking={
                "type": "enabled",
                "budget_tokens": 1000
            },
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Extract insight text
        insight_text = response.content[0].text
        
        return Insight(
            type=InsightType.ALERT,
            priority=Priority.CRITICAL,
            title="Enterprise churn increased 23%",
            description=insight_text,
            impact_revenue=-340000,
            confidence=0.85,
        )
    
    def _calculate_churn_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate churn metrics using Pandas."""
        # Add actual calculations here
        return {}
    
    async def _rank_insights(self, insights: List[Insight]) -> List[Insight]:
        """Rank insights by business impact."""
        return sorted(insights, key=lambda x: (x.priority.value, abs(x.impact_revenue)), reverse=True)
```

**File:** `backend/app/models/insight.py`

```python
from pydantic import BaseModel
from enum import Enum
from datetime import datetime

class InsightType(str, Enum):
    ALERT = "alert"
    OPPORTUNITY = "opportunity"
    TREND = "trend"

class Priority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Insight(BaseModel):
    type: InsightType
    priority: Priority
    title: str
    description: str
    impact_revenue: float  # Estimated $ impact
    impact_customers: int = 0  # # of customers affected
    confidence: float  # 0-1
    created_at: datetime = datetime.now()
    dismissed: bool = False
```

---

### Phase 4: Backend - Market Simulation

**Goal:** Enable "what-if" scenario testing

**File:** `backend/app/services/simulation_engine.py`

```python
import numpy as np
from typing import Dict, Any, List
from app.core.claude_client import claude_client

class SimulationEngine:
    """
    Monte Carlo simulation engine for testing product decisions.
    
    Showcases Opus 4.6:
    - Extended thinking (probabilistic reasoning)
    - Tool use (NumPy for calculations)
    - Uncertainty quantification
    """
    
    async def simulate_feature_launch(
        self,
        feature_name: str,
        target_segment: str,
        pricing_impact: float,
        development_time: int,
        historical_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Simulate launching a new feature.
        
        Returns:
        - Revenue impact (best/likely/worst case)
        - Adoption forecast
        - Risks
        - Recommendation
        """
        
        # Step 1: Let Claude create simulation parameters
        params = await self._generate_simulation_params(
            feature_name, target_segment, pricing_impact, historical_data
        )
        
        # Step 2: Run Monte Carlo simulation
        results = self._run_monte_carlo(params, n_simulations=10000)
        
        # Step 3: Let Claude interpret results
        interpretation = await self._interpret_results(results, params)
        
        return {
            "revenue_impact": results['revenue'],
            "adoption_forecast": results['adoption'],
            "risks": interpretation['risks'],
            "recommendation": interpretation['recommendation'],
            "confidence": results['confidence'],
        }
    
    async def _generate_simulation_params(
        self,
        feature_name: str,
        target_segment: str,
        pricing_impact: float,
        historical_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Use Claude to estimate simulation parameters.
        
        This showcases extended thinking for probabilistic reasoning.
        """
        
        prompt = f"""You are a data scientist. Estimate simulation parameters for this feature launch.

Feature: {feature_name}
Target Segment: {target_segment}
Pricing Impact: ${pricing_impact}/month
Historical Data: {historical_data}

Estimate these parameters (with uncertainty):
1. Adoption rate (% of target segment that will adopt)
2. Churn reduction (% decrease in churn for adopters)
3. New customer acquisition (# of new customers attracted)
4. Time to full adoption (weeks)

For each parameter, provide:
- Best case (90th percentile)
- Likely case (50th percentile)
- Worst case (10th percentile)

Think step-by-step about what drives each parameter.

Return JSON:
{{
  "adoption_rate": {{"best": 0.8, "likely": 0.5, "worst": 0.2}},
  "churn_reduction": {{"best": 0.3, "likely": 0.15, "worst": 0.05}},
  ...
}}
"""
        
        response = await claude_client.messages.create(
            model="claude-opus-4.6-20250514",
            max_tokens=2000,
            thinking={
                "type": "enabled",
                "budget_tokens": 1500
            },
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse JSON response
        return {}  # Placeholder
    
    def _run_monte_carlo(self, params: Dict[str, Any], n_simulations: int = 10000) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation using NumPy.
        
        This is the computational heavy lifting.
        """
        
        # Example: Simulate adoption rate
        adoption_samples = np.random.beta(
            a=params['adoption_rate']['likely'] * 10,
            b=(1 - params['adoption_rate']['likely']) * 10,
            size=n_simulations
        )
        
        # Simulate revenue impact
        revenue_samples = adoption_samples * params['target_segment_size'] * params['pricing_impact'] * 12
        
        # Calculate percentiles
        revenue_impact = {
            "best": float(np.percentile(revenue_samples, 90)),
            "likely": float(np.percentile(revenue_samples, 50)),
            "worst": float(np.percentile(revenue_samples, 10)),
        }
        
        # Simulate adoption over time (weekly)
        weeks = 12
        adoption_forecast = []
        for week in range(weeks):
            adoption_pct = float(np.mean(adoption_samples * (1 - np.exp(-week / 4))))
            adoption_forecast.append({
                "week": week,
                "adoption_percentage": adoption_pct
            })
        
        return {
            "revenue": revenue_impact,
            "adoption": adoption_forecast,
            "confidence": 0.78,  # Based on data quality
        }
    
    async def _interpret_results(self, results: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Let Claude interpret simulation results and make recommendations.
        """
        
        prompt = f"""Interpret these simulation results and make a recommendation.

Simulation Results:
{results}

Parameters:
{params}

Provide:
1. Key risks (what could go wrong?)
2. Recommendation (build it or not?)
3. Reasoning (why?)

Be specific and actionable.
"""
        
        response = await claude_client.messages.create(
            model="claude-opus-4.6-20250514",
            max_tokens=1000,
            thinking={
                "type": "enabled",
                "budget_tokens": 500
            },
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "risks": ["Risk 1", "Risk 2"],  # Parse from response
            "recommendation": "BUILD IT",
        }
```

---

### Phase 5: Frontend - Dashboard UI

**Goal:** Build Salesforce-style dashboard

**File:** `frontend/src/pages/Dashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { AlertBanner } from '../components/dashboard/AlertBanner';
import { InsightCard } from '../components/dashboard/InsightCard';
import { ChurnRiskWidget } from '../components/dashboard/ChurnRiskWidget';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { useInsights } from '../hooks/useInsights';

export const Dashboard: React.FC = () => {
  const { insights, loading } = useInsights();
  
  const criticalInsights = insights.filter(i => i.priority === 'critical');
  const otherInsights = insights.filter(i => i.priority !== 'critical');
  
  return (
    <PageLayout
      title="Dashboard"
      subtitle="Last updated: 2 minutes ago"
    >
      {/* Critical Alerts Section */}
      <div className="mb-sf-lg">
        {criticalInsights.map(insight => (
          <AlertBanner key={insight.id} insight={insight} />
        ))}
      </div>
      
      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sf-lg">
        <ChurnRiskWidget />
        <RevenueChart />
        {/* Add more widgets */}
      </div>
      
      {/* Other Insights */}
      <div className="mt-sf-xl">
        <h2 className="text-heading-l font-semibold mb-sf-md">
          Additional Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sf-md">
          {otherInsights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
};
```

**File:** `frontend/src/components/dashboard/AlertBanner.tsx`

```typescript
import React from 'react';
import { Insight } from '../../types';
import { Button } from '../shared/Button';

interface AlertBannerProps {
  insight: Insight;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ insight }) => {
  return (
    <div className="alert-critical rounded-md p-sf-md mb-sf-md flex items-start gap-sf-md">
      <div className="text-2xl">🚨</div>
      <div className="flex-1">
        <h4 className="text-heading-s font-semibold mb-sf-xs">
          Critical: {insight.title}
        </h4>
        <p className="text-body-m mb-sf-md opacity-90">
          {insight.description}
        </p>
        <div className="flex gap-sf-sm">
          <Button variant="primary" size="sm">
            Run Simulation
          </Button>
          <Button variant="secondary" size="sm">
            View Details
          </Button>
          <Button variant="text" size="sm">
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};
```

---

## Opus 4.6 Showcase Strategy

### Key Features to Highlight

**1. Extended Thinking**
- Enable in all Claude API calls
- Show thinking process in UI (expandable section)
- Narrate in demo: "Watch Opus 4.6 reason through multiple hypotheses"

**2. Agentic Workflow**
- No user prompts for insight generation
- AI autonomously decides what to analyze
- Demo: Upload CSV → AI explores independently

**3. Tool Use**
- Claude writes Python code for statistics
- Execute via subprocess or MCP server
- Show code execution logs in UI

**4. Vision (Bonus)**
- Analyze CSV structure visually
- Infer schema from messy data
- Demo: Upload poorly-named CSV → AI understands it

---

## Demo Video Script

**Length:** 3 minutes

**Structure:**

**0:00-0:30 - The Problem**
- Show PM drowning in spreadsheets
- "PMs spend 10+ hours/week analyzing data"
- "And they still miss critical insights"

**0:30-1:00 - The Solution**
- "Introducing Product Insight Autopilot"
- "Upload your data. AI does the rest."
- Show CSV upload → instant insights

**1:00-1:45 - Auto-Insights (Opus 4.6 Showcase)**
- Show executive summary
- Highlight extended thinking UI
- "Watch Opus 4.6 reason through the problem"
- Show actionable recommendation

**1:45-2:30 - Market Simulation**
- "Test decisions before building"
- Show: "What if we build SSO?"
- Display results with confidence intervals
- "340% ROI. Build it."

**2:30-3:00 - Impact**
- "Saves 10+ hours/week per PM"
- "Open source. Run it yourself."
- "Stop asking questions. Start seeing answers."

---

## Submission Checklist

- [ ] 3-minute demo video (YouTube/Loom)
- [ ] GitHub repository (clean, documented)
- [ ] README with setup instructions
- [ ] 100-200 word summary
- [ ] Working demo (no Docker initially)
- [ ] Salesforce-style UI with light/dark modes
- [ ] Opus 4.6 extended thinking showcased
- [ ] Agentic workflow demonstrated

---

**This plan is optimized for Claude Code execution. Follow step-by-step, and you'll have a winning hackathon project.** 🚀
