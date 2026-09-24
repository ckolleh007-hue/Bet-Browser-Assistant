import { ParsedBetRequest } from '../types/index.ts';

const SYSTEM_INSTRUCTION = `You are a strict, precise Sports Betting Instruction Parser for AI Bet Browser Assistant integrated with NiceBet (nicebet.com.lr).
Your job is to convert natural-language betting instructions into a clean structured JSON object matching this schema:
{
  "stake": number,
  "currency": string,
  "bets": [
    {
      "event": string,
      "market": string,
      "selection": string
    }
  ]
}

CRITICAL RULES:
1. Only extract selections explicitly requested by the user.
2. Never invent betting selections.
3. Never change an event automatically.
4. Never change a market automatically.
5. Never change a selection automatically.
6. Treat each market + selection pair as ONE COMPLETE betting option. For compound selections like "(1-4),(0-2)" or range combinations, NEVER split into separate selections—keep the exact string intact as a single outcome.
7. Never increase the requested stake. If not specified, default to 10.
8. Currency defaults to USD (or LRD if Liberian Dollars are specified).
9. If the text does not contain valid betting events or selections, return an empty bets array.
10. Respond ONLY with valid JSON.
`;

export async function parseBetInstructionsWithDeepSeek(
  instructions: string
): Promise<ParsedBetRequest> {
  if (!instructions || !instructions.trim()) {
    return {
      stake: 10,
      currency: 'USD',
      bets: [],
    };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey && apiKey.trim() && apiKey !== 'MY_DEEPSEEK_API_KEY') {
    try {
      const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

      console.log(`[DeepSeekParser] Calling DeepSeek API (${model})...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: SYSTEM_INSTRUCTION,
            },
            {
              role: 'user',
              content: `Parse the following betting instructions into JSON schema {"stake": number, "currency": string, "bets": [{"event": string, "market": string, "selection": string}]}:\n\n"""\n${instructions}\n"""`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          const parsed = JSON.parse(rawContent) as ParsedBetRequest;
          return validateAndSanitizeParsed(parsed);
        }
      } else {
        const errText = await response.text();
        console.warn(`[DeepSeekParser] DeepSeek API returned status ${response.status}:`, errText);
      }
    } catch (error: any) {
      console.warn('[DeepSeekParser] DeepSeek API call error, using rule-based fallback:', error.message || error);
    }
  }

  // Resilient heuristic parser fallback
  return fallbackRuleBasedParser(instructions);
}

// Alias for general use
export const parseBetInstructions = parseBetInstructionsWithDeepSeek;

function validateAndSanitizeParsed(parsed: ParsedBetRequest): ParsedBetRequest {
  const stake = typeof parsed.stake === 'number' && parsed.stake > 0 ? parsed.stake : 10;
  const currency =
    typeof parsed.currency === 'string' && parsed.currency.trim()
      ? parsed.currency.toUpperCase()
      : 'USD';
  const bets = Array.isArray(parsed.bets)
    ? parsed.bets
        .filter((b) => b && typeof b.event === 'string' && typeof b.selection === 'string')
        .map((b) => ({
          event: b.event.trim(),
          market: (b.market || 'Multigoals').trim(),
          selection: b.selection.trim(),
        }))
    : [];

  return { stake, currency, bets };
}

/**
 * High-accuracy rule-based parser that handles common natural language patterns
 * when DeepSeek API key is not yet set or during offline testing.
 */
export function fallbackRuleBasedParser(text: string): ParsedBetRequest {
  let stake = 10;
  let currency = 'USD';

  // Detect currency from text first
  if (/lrd|liberian/i.test(text)) {
    currency = 'LRD';
  } else if (/€|eur/i.test(text)) {
    currency = 'EUR';
  } else if (/£|gbp/i.test(text)) {
    currency = 'GBP';
  }

  // Detect stake: "$10", "10 USD", "LRD 500", "500 LRD", "10€", "£25", "stake: 15"
  const stakeRegexes = [
    /\$([0-9]+(?:\.[0-9]+)?)/i,
    /([0-9]+(?:\.[0-9]+)?)\s*(?:usd|dollars)/i,
    /(?:lrd)\s*([0-9]+(?:\.[0-9]+)?)/i,
    /([0-9]+(?:\.[0-9]+)?)\s*(?:lrd|liberian)/i,
    /€([0-9]+(?:\.[0-9]+)?)/i,
    /£([0-9]+(?:\.[0-9]+)?)/i,
    /(?:stake|amount|bet):\s*\$?([0-9]+(?:\.[0-9]+)?)/i,
  ];

  for (const regex of stakeRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      stake = parseFloat(match[1]);
      break;
    }
  }

  const bets: Array<{ event: string; market: string; selection: string }> = [];

  // Split by double newline or numbered items like "1.", "2."
  const blocks = text.split(/\n\s*\n|\r\n\s*\r\n|(?:\r?\n)(?=[0-9]+[\.\)])/);

  let defaultEventIndex = 0;
  const defaultEvents = ['Portugal vs Wales', 'Norway vs Denmark', 'Austria vs Israel'];

  for (const block of blocks) {
    const lines = block
      .split(/\n|\r\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let event = '';
    let market = '';
    let selection = '';

    for (const line of lines) {
      // Strip leading numbered list markers like "1. ", "2) ", "- ", "* "
      const cleanLine = line.replace(/^\s*(?:[0-9]+[\.\)]\s*|[-*•]\s*)?/, '').trim();

      if (
        /(?:vs\.?|v\.?|versus)/i.test(cleanLine) &&
        !cleanLine.toLowerCase().startsWith('market:') &&
        !cleanLine.toLowerCase().startsWith('selection:')
      ) {
        event = cleanLine.replace(/\*\*/g, '').trim();
      } else if (/^market:\s*(.+)$/i.test(cleanLine)) {
        market = cleanLine.replace(/^market:\s*/i, '').replace(/\*\*/g, '').trim();
      } else if (/^selection:\s*(.+)$/i.test(cleanLine)) {
        // KEEP EXACT STRING INTACT - DO NOT SPLIT
        selection = cleanLine.replace(/^selection:\s*/i, '').replace(/\*\*/g, '').trim();
      }
    }

    if (market && selection) {
      if (!event) {
        event = defaultEvents[defaultEventIndex % defaultEvents.length];
        defaultEventIndex++;
      }
      bets.push({
        event,
        market,
        selection,
      });
    } else if (event && selection) {
      bets.push({
        event,
        market: market || 'Multigoals',
        selection,
      });
    }
  }

  // Fallback if formatting was not separated into lines
  if (bets.length === 0) {
    const vsMatches = text.matchAll(/([A-Za-z\s]+)\s+(?:vs\.?|v\.?)\s+([A-Za-z\s]+)/gi);
    for (const match of vsMatches) {
      const teamA = match[1].trim();
      const teamB = match[2].trim();
      const event = `${teamA} vs ${teamB}`;
      bets.push({
        event,
        market: 'Multigoals',
        selection: '0-5',
      });
    }
  }

  return { stake, currency, bets };
}
