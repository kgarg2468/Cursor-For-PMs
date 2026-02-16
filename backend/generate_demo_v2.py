"""
Generate demo CSV dataset v2 — purpose-built for the hackathon demo script.
200 accounts with dramatically strong signals that Claude will surface immediately:

1. SSO/SAML driving enterprise churn crisis (~$180K MRR at risk)
2. NPS gap: enterprise SSO requesters avg 2.0 vs happy enterprise 8.5
3. SSO dominates feature requests by 3x
4. Free→Pro conversion stalled in last 60 days
5. APAC region has highest enterprise churn
"""

import csv
import random
import os
from datetime import datetime, timedelta

random.seed(2026)

# ── Company name generation ──────────────────────────────────────────────────

COMPANY_NAMES = [
    # Enterprise-sounding names (40)
    "Meridian Health Systems", "NovaCrest Financial", "Apex Logistics Group",
    "Stratton Dynamics", "Broadleaf Technologies", "Vanguard Dataworks",
    "Pinnacle SaaS Corp", "Summit Ridge Analytics", "Clearwater Digital",
    "Ironbridge Solutions", "Harbourfront Tech", "Cascadia Cloud",
    "Northstar Platforms", "Redwood Infra", "Titanium Systems",
    "Blackrock DevOps", "Sterling API Co", "Falcon Edge Computing",
    "Omega Compliance Inc", "Atlas Workforce", "Cobalt Engineering",
    "Evergreen Data Corp", "Palantyne Security", "Nexus Integration Co",
    "Ironclad Software", "Horizon Insights", "BlueShore Analytics",
    "Granite Health IT", "Keystone Platforms", "Silverline Systems",
    "Riverview Logistics", "Beacon Finance Tech", "Crestline Solutions",
    "Magellan Cloud Inc", "Osprey Networks", "Vantage Point AI",
    "Ridgeline DevTools", "Ashford Digital", "Windermere Corp",
    "Basalt Infrastructure",
    # Pro-tier names (60)
    "StackPilot", "CodeVault", "DeployFast", "ShipIt Labs", "PipelineHQ",
    "GitForge", "DevCanvas", "CloudBridge", "APILayer", "RunDeck",
    "TestGrid", "DocuSync", "FlowState", "BuildKite Pro", "SnapDeploy",
    "CIStream", "LogPulse", "MetricWire", "AlertOps", "PageDuty",
    "StatusCake Pro", "UptimeBot", "ErrorLens", "TraceView", "ProfilerX",
    "BenchMark Co", "LoadRunner Pro", "SecureScan", "VaultKey", "CertWatch",
    "TokenGuard", "SchemaForge", "QueryPro", "DataMesh", "LakeHouse",
    "StreamLine", "PubSubHQ", "EventBridge", "WebhookRelay", "QueueMaster",
    "CacheTier", "RedisManaged", "ObjectStore", "FileSync", "AssetPipe",
    "FontEnd Pro", "PixelSnap", "DesignToken", "ThemeKit", "IconForge",
    "MotionUI", "ChartBrew", "DashForge", "WidgetLab", "FormBuilder",
    "TableView", "GridMaster", "LayoutKit", "ComponentHub", "StyleGuide",
    # Free-tier names (100)
    "side-project-42", "hackathon-team-7", "indie-saas", "bootstrapdev",
    "solofounder-io", "mvp-factory", "ramen-profitable", "tiny-startup",
    "garage-labs", "weekend-project", "open-source-fan", "freemium-user",
    "trial-account", "student-dev", "hobby-coder", "pet-project",
    "free-tier-max", "localhost-hero", "npm-addict", "yarn-lover",
    "docker-fan", "k8s-newbie", "terraform-noob", "ansible-learner",
    "react-dev-42", "vue-enthusiast", "svelte-convert", "angular-holdout",
    "next-js-fan", "remix-curious", "astro-builder", "gatsby-migrator",
    "node-warrior", "deno-explorer", "bun-early-adopter", "rust-curious",
    "go-gopher", "python-forever", "ruby-on-rails-5ever", "elixir-alchemist",
    "tailwind-maximalist", "css-purist", "sass-defender", "postcss-fan",
    "webpack-survivor", "vite-convert", "esbuild-speed", "turbopack-beta",
    "postgres-loyalist", "mysql-legacy", "sqlite-simple", "mongo-flexible",
    "redis-cache-king", "elastic-searcher", "kafka-streamer", "rabbit-queuer",
    "aws-lambda-fan", "gcp-functions", "azure-curious", "vercel-deployer",
    "netlify-user", "railway-rider", "render-deployer", "fly-io-flyer",
    "supabase-stan", "firebase-refugee", "planetscale-fan", "neon-db-user",
    "clerk-auth", "auth0-free-tier", "keycloak-self-host", "lucia-auth-fan",
    "stripe-integrator", "paddle-billing", "lemon-squeezy", "gumroad-seller",
    "github-copilot-fan", "cursor-user", "cody-tester", "tabnine-og",
    "linear-board", "notion-power-user", "obsidian-vault", "logseq-graph",
    "figma-designer", "sketch-holdout", "canva-quick", "adobe-subscriber",
    "slack-overload", "discord-native", "teams-reluctant", "zoom-fatigued",
    "postman-tester", "insomnia-fan", "httpie-cli", "curl-purist",
    "sentry-monitorer", "datadog-trial", "grafana-oss", "prometheus-scraper",
    "jest-tester", "vitest-convert", "playwright-e2e", "cypress-classic",
]

# ── Feature requests pool ───────────────────────────────────────────────────

TOP_FEATURES = ["SSO/SAML", "API rate limit increase", "team permissions"]
OTHER_FEATURES = [
    "custom domains", "webhook retries", "audit logs",
    "GitHub integration", "Slack notifications", "multi-region deploy",
    "auto-scaling", "cost alerts", "CLI improvements", "GraphQL support",
    "log streaming", "rollback support", "env variable management",
    "private networking", "usage analytics dashboard", "2FA enforcement",
    "IP allowlisting", "RBAC enhancements", "container registry",
]

CHURN_REASONS_SSO = [
    "missing SSO", "no SAML support", "security requirements not met",
    "SSO compliance requirement", "enterprise security policy violation",
    "identity provider integration missing", "no SSO/SAML capability",
]

CHURN_REASONS_GENERAL = [
    "switched to competitor", "budget cuts", "project discontinued",
    "poor performance", "missing features", "support response time",
    "pricing too high", "team downsized", "acquired by another company",
    "internal tooling built", "contract not renewed",
]

REGIONS = ["US", "EU", "APAC"]

# ── Date helpers ─────────────────────────────────────────────────────────────

TODAY = datetime(2026, 2, 10)

def random_date(start, end):
    delta = end - start
    if delta.days <= 0:
        return start
    return start + timedelta(days=random.randint(0, delta.days))

def date_str(d):
    return d.strftime("%Y-%m-%d")

# ── Generate accounts ────────────────────────────────────────────────────────

NUM_ACCOUNTS = 200

# Plan distribution: 100 free, 60 pro, 40 enterprise
plan_assignments = ["free"] * 100 + ["pro"] * 60 + ["enterprise"] * 40
random.shuffle(plan_assignments)

# Region: US 40%, EU 30%, APAC 30%
region_assignments = random.choices(REGIONS, weights=[0.40, 0.30, 0.30], k=NUM_ACCOUNTS)

# Track enterprise indices
enterprise_indices = [i for i, p in enumerate(plan_assignments) if p == "enterprise"]

# Enterprise SSO churn: 16 of 40 enterprise accounts churned due to SSO (~40%)
enterprise_sso_churned = set(random.sample(enterprise_indices, 16))

# Make APAC enterprise churn higher: reassign region for most SSO churned to APAC
apac_sso_churned = random.sample(list(enterprise_sso_churned), 10)
for idx in apac_sso_churned:
    region_assignments[idx] = "APAC"
# Put remaining SSO churned in EU/US
for idx in enterprise_sso_churned - set(apac_sso_churned):
    region_assignments[idx] = random.choice(["US", "EU"])

# General churn: ~12 more from non-enterprise (total churn ~28/200 = 14%)
non_sso_churn_candidates = [i for i in range(NUM_ACCOUNTS) if i not in enterprise_sso_churned]
general_churned = set(random.sample(non_sso_churn_candidates, 12))
all_churned = enterprise_sso_churned | general_churned

# Conversion stall: pro accounts signed up in last 60 days = only 2
CONVERSION_DROP_START = TODAY - timedelta(days=60)

# Enterprise accounts requesting SSO (all churned + some active = ~30 of 40)
enterprise_sso_requesters = enterprise_sso_churned | set(random.sample(
    [i for i in enterprise_indices if i not in enterprise_sso_churned],
    min(14, len(enterprise_indices) - len(enterprise_sso_churned))
))

# Shuffle and assign company names
random.shuffle(COMPANY_NAMES)

rows = []
pro_recent_count = 0

for i in range(NUM_ACCOUNTS):
    account_id = f"ACC-{i+1:04d}"
    company_name = COMPANY_NAMES[i] if i < len(COMPANY_NAMES) else f"Company-{i+1}"
    plan = plan_assignments[i]
    region = region_assignments[i]

    # Signup date
    if plan == "pro":
        # Conversion stall: almost no pro signups in last 60 days
        if pro_recent_count < 2 and random.random() < 0.03:
            signup_date = random_date(CONVERSION_DROP_START, TODAY - timedelta(days=5))
            pro_recent_count += 1
        else:
            signup_date = random_date(TODAY - timedelta(days=730), CONVERSION_DROP_START - timedelta(days=1))
    else:
        signup_date = random_date(TODAY - timedelta(days=730), TODAY - timedelta(days=1))

    # MRR
    if plan == "free":
        mrr = 0
    elif plan == "pro":
        mrr = random.randint(79, 249)
    else:  # enterprise — higher MRR for dramatic revenue-at-risk
        if i in enterprise_sso_churned:
            mrr = random.randint(8000, 15000)  # High-value churned accounts
        else:
            mrr = random.randint(3000, 12000)

    # Churn
    churned = i in all_churned
    churn_date = ""
    churn_reason = ""

    if churned:
        earliest_churn = max(signup_date + timedelta(days=30), TODAY - timedelta(days=120))
        if earliest_churn < TODAY:
            churn_date = date_str(random_date(earliest_churn, TODAY - timedelta(days=5)))
        else:
            churn_date = date_str(signup_date + timedelta(days=30))

        if i in enterprise_sso_churned:
            churn_reason = random.choice(CHURN_REASONS_SSO)
        else:
            churn_reason = random.choice(CHURN_REASONS_GENERAL)

    # Last active
    if churned and churn_date:
        cd = datetime.strptime(churn_date, "%Y-%m-%d")
        last_active = date_str(random_date(cd - timedelta(days=14), cd))
    else:
        last_active = date_str(random_date(TODAY - timedelta(days=21), TODAY))

    # API calls (30d)
    if plan == "free":
        base_api = random.randint(50, 4000)
    elif plan == "pro":
        base_api = random.randint(8000, 80000)
    else:
        base_api = random.randint(80000, 500000)

    if churned:
        base_api = random.randint(0, max(1, base_api // 15))

    api_calls_30d = base_api

    # Team size
    if plan == "free":
        team_size = random.randint(1, 3)
    elif plan == "pro":
        team_size = random.randint(2, 15)
    else:
        team_size = random.randint(10, 150)

    # Feature requests — SSO dominates
    if i in enterprise_sso_requesters:
        chosen = ["SSO/SAML"]
        extra = random.randint(0, 2)
        for _ in range(extra):
            pick = random.choice(OTHER_FEATURES)
            if pick not in chosen:
                chosen.append(pick)
    elif plan == "enterprise":
        # Non-SSO enterprise: various requests
        num_req = random.randint(1, 3)
        chosen = []
        for _ in range(num_req):
            pick = random.choice(TOP_FEATURES[1:] + OTHER_FEATURES[:6])
            if pick not in chosen:
                chosen.append(pick)
    else:
        num_req = random.randint(1, 3)
        chosen = []
        for _ in range(num_req):
            # 70% chance SSO, 30% other — makes SSO dominate overall
            if random.random() < 0.45:
                pick = "SSO/SAML"
            elif random.random() < 0.5:
                pick = random.choice(TOP_FEATURES[1:])
            else:
                pick = random.choice(OTHER_FEATURES)
            if pick not in chosen:
                chosen.append(pick)

    feature_requests = "; ".join(chosen)

    # Support tickets (30d)
    if plan == "free":
        support_tickets_30d = random.choices(range(0, 3), weights=[60, 30, 10])[0]
    elif plan == "pro":
        support_tickets_30d = random.randint(0, 6)
    else:
        support_tickets_30d = random.randint(2, 15)

    if churned:
        support_tickets_30d = max(support_tickets_30d, random.randint(5, 18))

    # NPS score — dramatic gap for enterprise SSO requesters
    if i in enterprise_sso_churned:
        nps_score = random.randint(1, 3)  # Very low
    elif i in enterprise_sso_requesters and not churned:
        nps_score = random.randint(2, 4)  # Low (frustrated but staying)
    elif churned:
        nps_score = random.randint(1, 4)
    elif plan == "enterprise":
        nps_score = random.randint(7, 10)  # Happy enterprise (no SSO issue)
    elif plan == "pro":
        nps_score = random.randint(5, 10)
    else:
        nps_score = random.randint(3, 9)

    rows.append({
        "account_id": account_id,
        "company_name": company_name,
        "plan": plan,
        "mrr": mrr,
        "signup_date": date_str(signup_date),
        "last_active": last_active,
        "api_calls_30d": api_calls_30d,
        "team_size": team_size,
        "churned": churned,
        "churn_date": churn_date,
        "churn_reason": churn_reason,
        "feature_requests": feature_requests,
        "support_tickets_30d": support_tickets_30d,
        "nps_score": nps_score,
        "region": region,
    })

# ── Write CSV ────────────────────────────────────────────────────────────────

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "demo_dataset_v2.csv")

os.makedirs(OUTPUT_DIR, exist_ok=True)

FIELDNAMES = [
    "account_id", "company_name", "plan", "mrr", "signup_date", "last_active",
    "api_calls_30d", "team_size", "churned", "churn_date", "churn_reason",
    "feature_requests", "support_tickets_30d", "nps_score", "region",
]

with open(OUTPUT_FILE, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(rows)

# ── Verification ─────────────────────────────────────────────────────────────

total = len(rows)
plan_counts = {}
region_counts = {}
churn_count = 0
enterprise_sso_churn_count = 0
total_mrr_at_risk = 0
pro_recent_signups = 0
sso_request_count = 0

for r in rows:
    plan_counts[r["plan"]] = plan_counts.get(r["plan"], 0) + 1
    region_counts[r["region"]] = region_counts.get(r["region"], 0) + 1

    if "SSO" in r["feature_requests"]:
        sso_request_count += 1

    if r["churned"]:
        churn_count += 1
        if r["plan"] == "enterprise" and any(kw in r["churn_reason"].lower() for kw in ["sso", "saml", "security", "identity"]):
            enterprise_sso_churn_count += 1
            total_mrr_at_risk += r["mrr"]

    if r["plan"] == "pro":
        sd = datetime.strptime(r["signup_date"], "%Y-%m-%d")
        if sd >= CONVERSION_DROP_START:
            pro_recent_signups += 1

# NPS averages
enterprise_sso_nps = [r["nps_score"] for r in rows if r["plan"] == "enterprise" and "SSO" in r.get("feature_requests", "")]
enterprise_happy_nps = [r["nps_score"] for r in rows if r["plan"] == "enterprise" and "SSO" not in r.get("feature_requests", "") and not r["churned"]]

# Feature request frequency
feat_freq = {}
for r in rows:
    for f in r["feature_requests"].split("; "):
        f = f.strip()
        if f:
            feat_freq[f] = feat_freq.get(f, 0) + 1
top_features_sorted = sorted(feat_freq.items(), key=lambda x: -x[1])[:5]

# Active MRR
active_mrr = sum(r["mrr"] for r in rows if not r["churned"])

# APAC enterprise churn
apac_enterprise = [r for r in rows if r["region"] == "APAC" and r["plan"] == "enterprise"]
apac_enterprise_churned = [r for r in apac_enterprise if r["churned"]]

print(f"{'='*60}")
print(f"Demo Dataset v2 — Verification Report")
print(f"{'='*60}")
print(f"CSV written to: {OUTPUT_FILE}")
print(f"Total accounts: {total}")
print(f"Plan distribution: {plan_counts}")
print(f"Region distribution: {region_counts}")
print(f"")
print(f"── Key Signals ──")
print(f"Overall churn: {churn_count}/{total} ({churn_count/total*100:.1f}%)")
print(f"Enterprise SSO churn: {enterprise_sso_churn_count} accounts")
print(f"MRR at risk (enterprise SSO): ${total_mrr_at_risk:,}")
print(f"Active MRR: ${active_mrr:,}")
print(f"SSO/SAML in feature requests: {sso_request_count}/{total} accounts ({sso_request_count/total*100:.0f}%)")
print(f"Pro signups in last 60 days: {pro_recent_signups}")
print(f"")
print(f"── NPS Gap ──")
if enterprise_sso_nps:
    print(f"Enterprise SSO requesters avg NPS: {sum(enterprise_sso_nps)/len(enterprise_sso_nps):.1f}")
if enterprise_happy_nps:
    print(f"Enterprise (no SSO issue) avg NPS: {sum(enterprise_happy_nps)/len(enterprise_happy_nps):.1f}")
print(f"")
print(f"── APAC Churn ──")
print(f"APAC enterprise: {len(apac_enterprise)} total, {len(apac_enterprise_churned)} churned ({len(apac_enterprise_churned)/max(1,len(apac_enterprise))*100:.0f}%)")
print(f"")
print(f"── Top 5 Feature Requests ──")
for feat, count in top_features_sorted:
    print(f"  {feat}: {count}")
print(f"{'='*60}")
