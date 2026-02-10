"""
Generate a demo CSV dataset simulating a developer tools SaaS platform.
~500 accounts with built-in patterns for AI to discover.
"""

import csv
import random
import os
from datetime import datetime, timedelta

random.seed(42)

# ── Company name generation ──────────────────────────────────────────────────

PREFIXES = [
    "Data", "Cloud", "Dev", "Code", "Net", "Cyber", "Algo", "Byte", "Pixel",
    "Stack", "Node", "Grid", "Flux", "Core", "Edge", "Meta", "Sync", "Base",
    "Logic", "Bit", "Dash", "Sys", "App", "Web", "Infra", "Auto", "Smart",
    "Rapid", "Zero", "Open", "Deep", "Next", "Fast", "Blue", "Nova", "Hyper",
    "Prime", "Arc", "Ion", "Vex", "Zen", "Apex", "Volt", "Pulse", "Orbit",
    "Quantum", "Neon", "Astro", "Sonic", "Turbo", "Signal", "Vector", "Matrix",
    "Cipher", "Helix", "Prism", "Forge", "Atlas", "Nimbus", "Vertex", "Axon",
]

SUFFIXES = [
    "Forge", "Peak", "Stream", "Labs", "Hub", "Works", "Shift", "Ops",
    "Wave", "Scale", "Craft", "Flow", "Bridge", "Link", "Spark", "Dock",
    "Path", "Mesh", "Space", "Tech", "IO", "AI", "Systems", "Cloud",
    "Dev", "Stack", "Base", "Logic", "Bit", "Net", "Code", "App",
    "Solutions", "Platform", "Digital", "Software", "Dynamics", "Ventures",
    "Studio", "Group", "Inc", "HQ", "Co", "Micro", "Global", "Pro",
]

def generate_company_names(n):
    names = set()
    while len(names) < n:
        prefix = random.choice(PREFIXES)
        suffix = random.choice(SUFFIXES)
        if prefix != suffix:
            names.add(f"{prefix}{suffix}")
    return list(names)


# ── Feature requests pool ───────────────────────────────────────────────────

# Top 3 dominate heavily; rest are filler
TOP_FEATURES = ["SSO/SAML", "API rate limit increase", "team permissions"]
OTHER_FEATURES = [
    "custom domains", "webhook retries", "audit logs", "dark mode",
    "GitHub integration", "Slack notifications", "multi-region deploy",
    "auto-scaling", "cost alerts", "CLI improvements", "GraphQL support",
    "log streaming", "rollback support", "env variable management",
    "private networking", "usage analytics dashboard", "2FA enforcement",
    "IP allowlisting", "RBAC enhancements", "container registry",
]

ALL_FEATURES = TOP_FEATURES + OTHER_FEATURES

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
REGION_WEIGHTS = [0.45, 0.30, 0.25]

PLANS = ["free", "pro", "enterprise"]

# ── Date helpers ─────────────────────────────────────────────────────────────

TODAY = datetime(2026, 2, 10)

def random_date(start, end):
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)

def date_str(d):
    return d.strftime("%Y-%m-%d")


# ── Generate accounts ────────────────────────────────────────────────────────

NUM_ACCOUNTS = 500
company_names = generate_company_names(NUM_ACCOUNTS)

# Plan distribution: ~60% free, ~30% pro, ~10% enterprise
plan_assignments = (
    ["free"] * 300 +
    ["pro"] * 150 +
    ["enterprise"] * 50
)
random.shuffle(plan_assignments)

# Region assignments following specified distribution
region_assignments = random.choices(REGIONS, weights=REGION_WEIGHTS, k=NUM_ACCOUNTS)

rows = []

# Track enterprise SSO churn targets
enterprise_indices = [i for i, p in enumerate(plan_assignments) if p == "enterprise"]
# We want ~23% of enterprise requesting SSO to churn = 15-20 accounts
# We'll pick ~70 enterprise accounts to have SSO requests, and ~18 of those churn
enterprise_sso_requesters = random.sample(enterprise_indices, min(35, len(enterprise_indices)))
enterprise_sso_churned = set(random.sample(enterprise_sso_requesters, 18))

# Pattern 2: Free->Pro conversion drop in last 2 months
# We'll track pro signups and make very few in the last 2 months
CONVERSION_DROP_START = TODAY - timedelta(days=60)

# Track churned accounts for overall ~15% churn rate
# Enterprise SSO churned = 18, need ~57 more churned from other accounts
total_target_churn = 75  # ~15% of 500
remaining_churn_budget = total_target_churn - len(enterprise_sso_churned)

# Select non-enterprise-sso-churned accounts for general churn
non_sso_churn_candidates = [i for i in range(NUM_ACCOUNTS) if i not in enterprise_sso_churned]
general_churned = set(random.sample(non_sso_churn_candidates, remaining_churn_budget))

all_churned = enterprise_sso_churned | general_churned

for i in range(NUM_ACCOUNTS):
    account_id = f"ACC-{i+1:04d}"
    company_name = company_names[i]
    plan = plan_assignments[i]
    region = region_assignments[i]

    # Signup date: spread over last 2 years
    # Pattern 2: if plan is pro and recent, make signups sparse
    if plan == "pro":
        # 85% of pro accounts signed up > 2 months ago (conversion drop)
        if random.random() < 0.92:
            signup_date = random_date(TODAY - timedelta(days=730), CONVERSION_DROP_START)
        else:
            signup_date = random_date(CONVERSION_DROP_START, TODAY - timedelta(days=1))
    else:
        signup_date = random_date(TODAY - timedelta(days=730), TODAY - timedelta(days=1))

    # MRR based on plan
    if plan == "free":
        mrr = 0
    elif plan == "pro":
        mrr = random.randint(49, 199)
    else:  # enterprise
        mrr = random.randint(500, 5000)

    # Churn status
    churned = i in all_churned
    churn_date = ""
    churn_reason = ""

    if churned:
        # Churn happened sometime after signup, within last 6 months typically
        earliest_churn = max(signup_date + timedelta(days=30), TODAY - timedelta(days=180))
        if earliest_churn < TODAY:
            churn_date = date_str(random_date(earliest_churn, TODAY - timedelta(days=1)))
        else:
            churn_date = date_str(signup_date + timedelta(days=30))

        if i in enterprise_sso_churned:
            churn_reason = random.choice(CHURN_REASONS_SSO)
        else:
            churn_reason = random.choice(CHURN_REASONS_GENERAL)

    # Last active: if churned, near churn date; otherwise recent
    if churned and churn_date:
        cd = datetime.strptime(churn_date, "%Y-%m-%d")
        last_active = date_str(random_date(cd - timedelta(days=14), cd))
    else:
        last_active = date_str(random_date(TODAY - timedelta(days=30), TODAY))

    # API calls (30d)
    # Pattern 3: EU accounts have anomalously high API calls (3-5x)
    if plan == "free":
        base_api = random.randint(100, 5000)
    elif plan == "pro":
        base_api = random.randint(5000, 50000)
    else:
        base_api = random.randint(50000, 200000)

    if region == "EU":
        # ~40% of EU accounts have anomalously high usage (3-5x)
        if random.random() < 0.40:
            base_api = int(base_api * random.uniform(3.0, 5.0))

    if churned:
        base_api = random.randint(0, max(1, base_api // 10))

    api_calls_30d = base_api

    # Team size
    if plan == "free":
        team_size = random.randint(1, 3)
    elif plan == "pro":
        team_size = random.randint(2, 15)
    else:
        team_size = random.randint(5, 100)

    # Feature requests (comma-separated)
    # Pattern 4: top 3 features dominate
    # Pattern 1: enterprise SSO requesters include SSO/SAML
    num_requests = random.randint(1, 4)
    if i in enterprise_sso_requesters:
        # Always include SSO/SAML for these accounts
        chosen = ["SSO/SAML"]
        remaining = [f for f in ALL_FEATURES if f != "SSO/SAML"]
        # Add more requests, weighted toward top features
        extra = random.randint(0, 2)
        for _ in range(extra):
            if random.random() < 0.5:
                pick = random.choice(TOP_FEATURES[1:])  # other top features
            else:
                pick = random.choice(OTHER_FEATURES)
            if pick not in chosen:
                chosen.append(pick)
    else:
        chosen = []
        for _ in range(num_requests):
            # 60% chance of picking a top feature, 40% other
            if random.random() < 0.55:
                pick = random.choice(TOP_FEATURES)
            else:
                pick = random.choice(OTHER_FEATURES)
            if pick not in chosen:
                chosen.append(pick)

    feature_requests = "; ".join(chosen)

    # Support tickets (30d)
    if plan == "free":
        support_tickets_30d = random.choices(range(0, 4), weights=[50, 30, 15, 5])[0]
    elif plan == "pro":
        support_tickets_30d = random.randint(0, 8)
    else:
        support_tickets_30d = random.randint(1, 15)

    if churned:
        # Churned accounts often had higher tickets before leaving
        support_tickets_30d = max(support_tickets_30d, random.randint(3, 12))

    # NPS score (0-10)
    # Pattern 1: enterprise without SSO trends lower (2-5)
    if i in enterprise_sso_churned:
        nps_score = random.randint(1, 4)
    elif i in enterprise_sso_requesters and not churned:
        nps_score = random.randint(2, 5)
    elif churned:
        nps_score = random.randint(1, 5)
    elif plan == "enterprise":
        nps_score = random.randint(6, 10)
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

OUTPUT_DIR = "/Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "demo_dataset.csv")

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

# ── Verification / stats ─────────────────────────────────────────────────────

total = len(rows)
plan_counts = {}
region_counts = {}
churn_count = 0
enterprise_sso_churn_count = 0
pro_recent_signups = 0

for r in rows:
    plan_counts[r["plan"]] = plan_counts.get(r["plan"], 0) + 1
    region_counts[r["region"]] = region_counts.get(r["region"], 0) + 1
    if r["churned"]:
        churn_count += 1
        if r["plan"] == "enterprise" and "SSO" in r["churn_reason"].upper() or "SAML" in r["churn_reason"].upper() or "security" in r["churn_reason"].lower():
            enterprise_sso_churn_count += 1
    if r["plan"] == "pro":
        sd = datetime.strptime(r["signup_date"], "%Y-%m-%d")
        if sd >= CONVERSION_DROP_START:
            pro_recent_signups += 1

# EU high-API accounts
eu_high_api = sum(1 for r in rows if r["region"] == "EU" and not r["churned"] and r["api_calls_30d"] > 100000)

# Feature request frequency
feat_freq = {}
for r in rows:
    for f in r["feature_requests"].split("; "):
        f = f.strip()
        if f:
            feat_freq[f] = feat_freq.get(f, 0) + 1

top_features_sorted = sorted(feat_freq.items(), key=lambda x: -x[1])[:5]

print(f"CSV written to: {OUTPUT_FILE}")
print(f"Total accounts: {total}")
print(f"Plan distribution: {plan_counts}")
print(f"Region distribution: {region_counts}")
print(f"Overall churn: {churn_count} ({churn_count/total*100:.1f}%)")
print(f"Enterprise SSO-related churn: {enterprise_sso_churn_count}")
print(f"Pro signups in last 2 months: {pro_recent_signups}")
print(f"EU accounts with high API calls (>100k): {eu_high_api}")
print(f"Top 5 feature requests: {top_features_sorted}")
