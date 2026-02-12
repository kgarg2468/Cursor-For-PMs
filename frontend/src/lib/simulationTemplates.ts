import type { SimTemplate } from "@/types/simulation";

export const SIMULATION_TEMPLATES: SimTemplate[] = [
  {
    id: "sso-tax",
    name: "The SSO Tax",
    subtitle: "Monetization Gate",
    description: "Model the revenue impact of gating SSO/SAML behind an enterprise tier",
    icon: "Lock",
    nodes: [
      {
        id: "current-product",
        type: "source",
        position: { x: 50, y: 180 },
        data: {
          label: "Current Product",
          subtitle: "Revenue baseline",
          icon: "DollarSign",
          params: [
            { key: "arr", label: "Current ARR", type: "currency", default: 2400000, min: 100000, max: 50000000, step: 100000 },
            { key: "enterprise_count", label: "Enterprise Accounts", type: "number", default: 45, min: 1, max: 500, step: 1 },
            { key: "seat_price", label: "Seat Price ($/mo)", type: "currency", default: 49, min: 5, max: 500, step: 5 },
            { key: "avg_seats", label: "Avg Seats/Account", type: "number", default: 25, min: 1, max: 500, step: 1 },
          ],
        },
      },
      {
        id: "sso-gate",
        type: "modifier",
        position: { x: 350, y: 80 },
        data: {
          label: "SSO Gate",
          subtitle: "Migration timeline",
          icon: "ShieldCheck",
          params: [
            { key: "migration_months", label: "Migration Window", type: "months", default: 6, min: 1, max: 24, step: 1 },
            { key: "comms_quality", label: "Comms Quality", type: "slider", default: 70, min: 0, max: 100, step: 5 },
          ],
        },
      },
      {
        id: "enterprise-tier",
        type: "modifier",
        position: { x: 350, y: 220 },
        data: {
          label: "Enterprise Tier",
          subtitle: "Pricing uplift",
          icon: "Crown",
          params: [
            { key: "enterprise_seat_price", label: "Enterprise Price ($/mo)", type: "currency", default: 89, min: 20, max: 500, step: 5 },
          ],
        },
      },
      {
        id: "churn-risk",
        type: "modifier",
        position: { x: 350, y: 360 },
        data: {
          label: "Churn Risk",
          subtitle: "Customer loss",
          icon: "AlertTriangle",
          params: [
            { key: "churn_pct", label: "Expected Churn %", type: "percentage", default: 12, min: 0, max: 50, step: 1 },
            { key: "churn_window", label: "Churn Window", type: "months", default: 3, min: 1, max: 12, step: 1 },
          ],
        },
      },
      {
        id: "revenue-impact",
        type: "sink",
        position: { x: 680, y: 140 },
        data: {
          label: "Revenue Impact",
          subtitle: "Net ARR change",
          icon: "TrendingUp",
          params: [],
        },
      },
      {
        id: "customer-count",
        type: "sink",
        position: { x: 680, y: 310 },
        data: {
          label: "Customer Count",
          subtitle: "Net account change",
          icon: "Users",
          params: [],
        },
      },
    ],
    edges: [
      { id: "e1", source: "current-product", target: "sso-gate", animated: true },
      { id: "e2", source: "current-product", target: "enterprise-tier", animated: true },
      { id: "e3", source: "current-product", target: "churn-risk", animated: true },
      { id: "e4", source: "sso-gate", target: "revenue-impact", animated: true },
      { id: "e5", source: "enterprise-tier", target: "revenue-impact", animated: true },
      { id: "e6", source: "churn-risk", target: "revenue-impact", animated: true },
      { id: "e7", source: "churn-risk", target: "customer-count", animated: true },
      { id: "e8", source: "sso-gate", target: "customer-count", animated: true },
    ],
  },

  {
    id: "usage-based-pivot",
    name: "The Usage-Based Pivot",
    subtitle: "Business Model Shift",
    description: "Simulate switching from per-seat to usage-based pricing",
    icon: "Activity",
    nodes: [
      {
        id: "current-pricing",
        type: "source",
        position: { x: 50, y: 180 },
        data: {
          label: "Current Pricing",
          subtitle: "Per-seat model",
          icon: "CreditCard",
          params: [
            { key: "seat_price", label: "Seat Price ($/mo)", type: "currency", default: 49, min: 5, max: 500, step: 5 },
            { key: "total_accounts", label: "Total Accounts", type: "number", default: 500, min: 10, max: 10000, step: 10 },
            { key: "avg_seats", label: "Avg Seats/Account", type: "number", default: 12, min: 1, max: 200, step: 1 },
          ],
        },
      },
      {
        id: "usage-pricing",
        type: "modifier",
        position: { x: 350, y: 60 },
        data: {
          label: "Usage Pricing",
          subtitle: "Per-call model",
          icon: "Activity",
          params: [
            { key: "price_per_call", label: "Price per API Call ($)", type: "currency", default: 0.01, min: 0.001, max: 1, step: 0.001 },
            { key: "base_fee", label: "Platform Fee ($/mo)", type: "currency", default: 29, min: 0, max: 200, step: 5 },
            { key: "avg_calls", label: "Avg Calls/User/Mo", type: "number", default: 3000, min: 100, max: 50000, step: 100 },
          ],
        },
      },
      {
        id: "power-user-uplift",
        type: "modifier",
        position: { x: 350, y: 220 },
        data: {
          label: "Power User Uplift",
          subtitle: "Heavy usage segment",
          icon: "Zap",
          params: [
            { key: "power_user_pct", label: "Power User %", type: "percentage", default: 15, min: 1, max: 50, step: 1 },
            { key: "usage_multiplier", label: "Usage Multiplier", type: "slider", default: 5, min: 2, max: 20, step: 1 },
          ],
        },
      },
      {
        id: "bill-shock-churn",
        type: "modifier",
        position: { x: 350, y: 380 },
        data: {
          label: "Churn from Unpredictability",
          subtitle: "Bill shock risk",
          icon: "AlertCircle",
          params: [
            { key: "bill_shock_churn", label: "Bill Shock Churn %", type: "percentage", default: 8, min: 0, max: 30, step: 1 },
            { key: "spending_cap_adoption", label: "Spending Cap Adoption %", type: "percentage", default: 40, min: 0, max: 100, step: 5 },
          ],
        },
      },
      {
        id: "revenue-distribution",
        type: "sink",
        position: { x: 680, y: 140 },
        data: {
          label: "Revenue Distribution",
          subtitle: "New revenue shape",
          icon: "BarChart3",
          params: [],
        },
      },
      {
        id: "net-revenue-change",
        type: "sink",
        position: { x: 680, y: 310 },
        data: {
          label: "Net Revenue Change",
          subtitle: "Delta from current",
          icon: "TrendingUp",
          params: [],
        },
      },
    ],
    edges: [
      { id: "e1", source: "current-pricing", target: "usage-pricing", animated: true },
      { id: "e2", source: "current-pricing", target: "power-user-uplift", animated: true },
      { id: "e3", source: "current-pricing", target: "bill-shock-churn", animated: true },
      { id: "e4", source: "usage-pricing", target: "revenue-distribution", animated: true },
      { id: "e5", source: "power-user-uplift", target: "revenue-distribution", animated: true },
      { id: "e6", source: "bill-shock-churn", target: "net-revenue-change", animated: true },
      { id: "e7", source: "usage-pricing", target: "net-revenue-change", animated: true },
      { id: "e8", source: "power-user-uplift", target: "net-revenue-change", animated: true },
    ],
  },

  {
    id: "viral-loop",
    name: "The Viral Loop",
    subtitle: "Growth Hack",
    description: "Model the impact of adding a 'Powered By' badge to drive organic growth",
    icon: "Repeat",
    nodes: [
      {
        id: "current-growth",
        type: "source",
        position: { x: 50, y: 180 },
        data: {
          label: "Current Growth",
          subtitle: "Organic baseline",
          icon: "TrendingUp",
          params: [
            { key: "monthly_new_users", label: "Monthly New Users", type: "number", default: 800, min: 10, max: 50000, step: 50 },
            { key: "current_cac", label: "Current CAC ($)", type: "currency", default: 120, min: 10, max: 1000, step: 10 },
            { key: "free_tier_users", label: "Free Tier Users", type: "number", default: 5000, min: 100, max: 100000, step: 100 },
          ],
        },
      },
      {
        id: "powered-by-badge",
        type: "modifier",
        position: { x: 350, y: 60 },
        data: {
          label: '"Powered By" Badge',
          subtitle: "Impression engine",
          icon: "Eye",
          params: [
            { key: "impression_rate", label: "Daily Impressions/User", type: "number", default: 50, min: 1, max: 500, step: 5 },
            { key: "ctr", label: "Badge CTR %", type: "percentage", default: 0.3, min: 0.01, max: 5, step: 0.05 },
          ],
        },
      },
      {
        id: "viral-coefficient",
        type: "modifier",
        position: { x: 350, y: 220 },
        data: {
          label: "Viral Coefficient",
          subtitle: "K-factor dynamics",
          icon: "Share2",
          params: [
            { key: "k_factor", label: "K-Factor", type: "slider", default: 0.4, min: 0.05, max: 2, step: 0.05 },
            { key: "viral_cycle_days", label: "Viral Cycle (days)", type: "number", default: 14, min: 1, max: 90, step: 1 },
          ],
        },
      },
      {
        id: "brand-perception",
        type: "modifier",
        position: { x: 350, y: 380 },
        data: {
          label: "Brand Perception Risk",
          subtitle: "Enterprise pushback",
          icon: "ShieldAlert",
          params: [
            { key: "enterprise_churn_from_badge", label: "Enterprise Churn %", type: "percentage", default: 3, min: 0, max: 20, step: 0.5 },
            { key: "premium_conversion_drop", label: "Premium Conv. Drop %", type: "percentage", default: 5, min: 0, max: 30, step: 1 },
          ],
        },
      },
      {
        id: "user-growth-curve",
        type: "sink",
        position: { x: 680, y: 140 },
        data: {
          label: "User Growth Curve",
          subtitle: "Projected user growth",
          icon: "LineChart",
          params: [],
        },
      },
      {
        id: "cac-impact",
        type: "sink",
        position: { x: 680, y: 310 },
        data: {
          label: "CAC Impact",
          subtitle: "Blended CAC change",
          icon: "DollarSign",
          params: [],
        },
      },
    ],
    edges: [
      { id: "e1", source: "current-growth", target: "powered-by-badge", animated: true },
      { id: "e2", source: "current-growth", target: "viral-coefficient", animated: true },
      { id: "e3", source: "current-growth", target: "brand-perception", animated: true },
      { id: "e4", source: "powered-by-badge", target: "user-growth-curve", animated: true },
      { id: "e5", source: "viral-coefficient", target: "user-growth-curve", animated: true },
      { id: "e6", source: "brand-perception", target: "cac-impact", animated: true },
      { id: "e7", source: "powered-by-badge", target: "cac-impact", animated: true },
      { id: "e8", source: "viral-coefficient", target: "cac-impact", animated: true },
    ],
  },
];
