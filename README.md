# AI Bet Browser Assistant

An AI-powered browser assistant that accepts natural-language betting instructions, converts them into structured betting selections via DeepSeek AI, navigates NiceBet (nicebet.com.lr) using Playwright, finds the requested markets and selections, builds a bet slip, verifies selections with an automated verification engine, and halts before the final transaction screen under a mandatory safety barrier.

---

## ⚠️ Important Safety & Compliance Notice

This application is strictly for **development and testing purposes**.
- **No real-money transactions**: The application does NOT connect to real-money sportsbook accounts or real payment gateways in this version.
- **Mandatory Final Transaction Safety Barrier**: The agent is mechanically and programmatically barred from clicking "PLACE BET" or submitting any transaction.
- **Manual Confirmation Required**: Only a human user can manually confirm a transaction after inspecting the verified bet slip.
- **No Guessing Policy**: If an event, market, or selection is ambiguous or missing, the agent stops immediately and will never substitute or place an unintended bet.

---

## 🏗️ Architecture Overview

```
AI Bet Browser Assistant
├── /client (React + Vite + Tailwind CSS + Lucide Icons)
│   ├── src/components/Header.tsx              (Status indicators & Global Emergency Stop)
│   ├── src/components/Sidebar.tsx             (Dashboard navigation)
│   ├── src/components/DashboardHome.tsx       (Status overview & quick metrics)
│   ├── src/components/NewBetView.tsx          (Natural language input & Gemini JSON preview/editor)
│   ├── src/components/BetSlipView.tsx         (Professional slip & Verification breakdown)
│   ├── src/components/SafetyBarrierBanner.tsx (Waiting for review screen & manual confirm)
│   ├── src/components/BrowserView.tsx         (Headless Chromium status & DOM inspector)
│   ├── src/components/ActivityLogView.tsx     (Timestamped real-time event stream)
│   ├── src/components/MockSportsbookView.tsx  (Simulated sportsbook matches & odds)
│   └── src/components/SettingsView.tsx        (PostgreSQL, Gemini, and Safety config)
│
├── /server (Express + TypeScript + tsx)
│   ├── server.ts                             (Full-stack entry point on Port 3000)
│   ├── src/ai/geminiParser.ts                (@google/genai structured output with Type.OBJECT)
│   ├── src/browser/browserController.ts      (Playwright Chromium automation & Safety Interceptor)
│   ├── src/agent/betAgent.ts                 (12-step autonomous execution loop)
│   ├── src/services/mockSportsbook.ts        (Mock sporting events, markets, odds & bet slip)
│   ├── src/services/verificationEngine.ts    (7-field comparison against original instruction)
│   ├── src/database/index.ts                 (PostgreSQL client with resilient fallback storage)
│   └── src/routes/                           (REST endpoints for bets, browser, and sportsbook)
│
└── /tests
    └── tests/betAssistant.test.ts            (10 automated tests verifying AI, search, slip & safety)
```

---

## 🤖 DeepSeek Prompt & Structured Schema Design

The assistant leverages the DeepSeek API (`deepseek-chat` / DeepSeek-V3) with JSON mode output and robust fallback.

### Strict Extraction Schema:
```json
{
  "stake": 10,
  "currency": "USD",
  "bets": [
    {
      "event": "Portugal vs Wales",
      "market": "Multigoals",
      "selection": "0-5"
    }
  ]
}
```

### Safety Guardrails Built into Parser:
1. Rejects instructions that lack a positive stake amount.
2. Extracts exact team names without extrapolating unspecified markets.
3. Fallback heuristic parser is provided when offline or missing keys.

---

## 🕹️ Playwright Workflow (12-Step Agent Loop)

1. **Start browser**: Launches headless Chromium using Playwright (`--no-sandbox`, `--disable-gpu`).
2. **Open NiceBet sportsbook**: Navigates to NiceBet Liberia (`nicebet.com.lr`) and resets previous state.
3. **Search for requested event**: Queries the sportsbook database or search input for the match.
4. **Find requested market**: Locates the specific betting market (e.g., Multigoals, Multigoals 1 & Multigoals 2).
5. **Find requested selection**: Locates the outcome and extracts current odds.
6. **Add selection to bet slip**: Emulates user click on odds to register selection.
7. **Repeat for every bet**: Iterates over all requested legs.
8. **Open bet slip**: Navigates to the active slip view.
9. **Verify selections**: Dispatches `VerificationEngine` comparing 7 fields between request and actual slip.
10. **Enter stake**: Sets the requested stake amount and calculates combined odds & potential return.
11. **Navigate to final confirmation**: Displays the review screen.
12. **STOP**: Agent halts execution, sets status to `WAITING FOR REVIEW`, and transfers control to the human user.

---

## 🛡️ Final Transaction Safety Barrier

The `BrowserController` class enforces an interceptor at code level:
```typescript
public assertSafeClickTarget(selector: string): void {
  const normalized = selector.toLowerCase();
  for (const forbidden of FORBIDDEN_TRANSACTION_SELECTORS) {
    if (normalized.includes(forbidden.toLowerCase())) {
      throw new Error(
        `[CRITICAL SAFETY BARRIER ENFORCED]: Automation is strictly barred from clicking "${forbidden}". Execution halted immediately.`
      );
    }
  }
}
```
Any attempt by Playwright automation to click selectors such as `PLACE BET`, `CONFIRM BET`, or `SUBMIT BET` triggers an immediate fatal exception, halting the agent and preserving full audit logs.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- (Optional) PostgreSQL database (a persistent database fallback is integrated if PostgreSQL is not active)
- (Optional) DeepSeek API Key in `DEEPSEEK_API_KEY` (from https://platform.deepseek.com)

### 2. Installation
```bash
npm install
npx playwright install chromium
```

### 3. Running the Application
```bash
npm run dev
```
The server will start on `http://localhost:3000` with both Express API endpoints and Vite React client mounted.

### 4. Running the Automated Tests
```bash
npm test
```
Runs the 10 automated test suites verifying AI parsing, event search, market search, selection resolution, verification engine, emergency stop, and the safety barrier test.

---

## 🧪 Verified Test Matrix

| # | Test Name | Status |
|---|---|---|
| 1 | AI instruction parsing | ✅ Passing |
| 2 | Event search | ✅ Passing |
| 3 | Market search | ✅ Passing |
| 4 | Selection search | ✅ Passing |
| 5 | Correct selection & odds computation | ✅ Passing |
| 6 | Incorrect selection rejection | ✅ Passing |
| 7 | Stake validation & return calculation | ✅ Passing |
| 8 | Bet-slip verification & mismatch detection | ✅ Passing |
| 9 | Emergency stop trigger & browser interrupt | ✅ Passing |
| 10 | Final transaction barrier (proves agent cannot click "PLACE BET") | ✅ Passing |

---

## 📋 Production Deployment Recommendations

When deploying to production:
1. **Network Sandbox**: Isolate browser agents in dedicated ephemeral containers (e.g. Google Cloud Run or Docker).
2. **PostgreSQL Connection Pool**: Configure `DATABASE_URL` with SSL connection (`sslmode=require`) and connection pooling.
3. **Encrypted Session State**: Keep user sessions authenticated using signed JWTs and secure HTTP-only cookies.
4. **Audit Immutability**: Write activity logs to an append-only audit trail in PostgreSQL or Cloud Logging.
5. **Rate Limiting**: Protect the `/api/bets/parse` endpoint with token-bucket rate limiters.
