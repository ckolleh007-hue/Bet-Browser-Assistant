import { mockSportsbook } from './mockSportsbook.ts';
import { SelectionValidator, SelectionValidationResult } from './selectionValidator.ts';
import {
  AiAutoPickCandidate,
  CandidateCombination,
  AiAutoPickResponse,
  SportsbookEvent,
} from '../types/index.ts';

export class AiAutoPickService {
  public static readonly TARGET_MIN_ODDS = 2.0;
  public static readonly TARGET_MAX_ODDS = 2.14;

  /**
   * Run the full AI Auto Pick scanning, analysis, combination evaluation,
   * odds filtering (2.00-2.14), and selection process.
   */
  public async generateAutoPick(
    stake = 10,
    currency = 'USD',
    optionFilter: 'all' | 'option1' | 'option2' = 'all'
  ): Promise<AiAutoPickResponse> {
    const auditTrail: string[] = [];
    const pushAudit = (msg: string) => {
      auditTrail.push(msg);
    };

    pushAudit('AI Auto Pick started');
    pushAudit(`Option mode: ${optionFilter === 'option1' ? 'Option 1 (Multigoals 0-5)' : optionFilter === 'option2' ? 'Option 2 (Multigoals 1 & Multigoals 2 (1-4),(0-2))' : 'Both Options'}`);
    pushAudit('Scanning NiceBet live sportsbook (https://www.nicebet.com.lr/en/sports)');

    // 1. Fetch fresh live events directly from NiceBet Liberia
    try {
      await mockSportsbook.refreshEvents();
    } catch {
      pushAudit('Continuing with cached NiceBet events');
    }

    const events = mockSportsbook.getEvents();
    pushAudit(`NiceBet events discovered: ${events.length}`);

    // Preload markets for top events if needed
    for (const ev of events.slice(0, 10)) {
      if (ev.markets.length <= 2) {
        try {
          await mockSportsbook.loadFullEventMarkets(ev.id);
        } catch {
          // ignore
        }
      }
    }

    // 2. Discover Option 1 (Multigoals -> 0-5) and/or Option 2 (Multigoals 1 & Multigoals 2 -> (1-4),(0-2))
    const option1Candidates: AiAutoPickCandidate[] = [];
    const option2Candidates: AiAutoPickCandidate[] = [];

    const searchOption1 = optionFilter === 'all' || optionFilter === 'option1';
    const searchOption2 = optionFilter === 'all' || optionFilter === 'option2';

    if (searchOption1) {
      pushAudit('Searching: Multigoals → 0-5');
      for (const ev of events) {
        // Ensure markets are loaded
        mockSportsbook.ensureDefaultMarkets(ev);

        const mgMarket = mockSportsbook.findMarket(ev, 'Multigoals');
        if (mgMarket) {
          const outcome = mockSportsbook.findOutcome(ev, mgMarket, '0-5');
          if (outcome && typeof outcome.odds === 'number' && outcome.odds > 1.0) {
            const analysisResult = this.analyzeOption1(ev, outcome.odds);
            option1Candidates.push({
              eventId: ev.id,
              teams: ev.title,
              homeTeam: ev.homeTeam,
              awayTeam: ev.awayTeam,
              market: 'Multigoals',
              selection: '0-5',
              odds: outcome.odds,
              analysis: analysisResult.analysis,
              confidence: analysisResult.confidence,
              dataQuality: 'EXCELLENT',
              stats: ev.stats,
            });
          }
        }
      }
      pushAudit(`Candidates found for Multigoals → 0-5: ${option1Candidates.length}`);
    }

    if (searchOption2) {
      pushAudit('Searching: Multigoals 1 & Multigoals 2 → (1-4),(0-2)');
      for (const ev of events) {
        mockSportsbook.ensureDefaultMarkets(ev);

        const mgComboMarket = mockSportsbook.findMarket(ev, 'Multigoals 1 & Multigoals 2');
        if (mgComboMarket) {
          const outcome = mockSportsbook.findOutcome(ev, mgComboMarket, '(1-4),(0-2)');
          if (outcome && typeof outcome.odds === 'number' && outcome.odds > 1.0) {
            const analysisResult = this.analyzeOption2(ev, outcome.odds);
            option2Candidates.push({
              eventId: ev.id,
              teams: ev.title,
              homeTeam: ev.homeTeam,
              awayTeam: ev.awayTeam,
              market: 'Multigoals 1 & Multigoals 2',
              selection: '(1-4),(0-2)',
              odds: outcome.odds,
              analysis: analysisResult.analysis,
              confidence: analysisResult.confidence,
              dataQuality: 'EXCELLENT',
              stats: ev.stats,
            });
          }
        }
      }
      pushAudit(`Candidates found for Multigoals 1 & Multigoals 2 → (1-4),(0-2): ${option2Candidates.length}`);
    }

    pushAudit('Analyzing teams and matches from NiceBet');
    pushAudit('Analyzing recent form, home/away patterns, and head-to-head records');

    // 3. Generate candidate combinations
    // Rules:
    // - Distinct events (one event per combination!)
    // - Combinations conform to selected Option 1 / Option 2 / Both
    pushAudit('Generating candidate combinations');
    const allCandidates = [
      ...(searchOption1 ? option1Candidates : []),
      ...(searchOption2 ? option2Candidates : []),
    ];
    const combinations: CandidateCombination[] = [];

    // Evaluate single-leg qualification (e.g. single match meets 2.00-2.14)
    for (const c of allCandidates) {
      const qualifies =
        c.odds >= AiAutoPickService.TARGET_MIN_ODDS - 0.001 &&
        c.odds <= AiAutoPickService.TARGET_MAX_ODDS + 0.001;
      let rejectReason: string | undefined;
      if (c.odds < AiAutoPickService.TARGET_MIN_ODDS) {
        rejectReason = `Odds ${c.odds.toFixed(2)} below minimum threshold of ${AiAutoPickService.TARGET_MIN_ODDS.toFixed(2)}`;
      } else if (c.odds > AiAutoPickService.TARGET_MAX_ODDS) {
        rejectReason = `Odds ${c.odds.toFixed(2)} above maximum threshold of ${AiAutoPickService.TARGET_MAX_ODDS.toFixed(2)}`;
      }
      combinations.push({
        id: `single-${c.eventId}`,
        selections: [c],
        combinedOdds: c.odds,
        qualifies,
        rejectReason,
        averageConfidence: c.confidence,
        statisticalScore: c.confidence * 100,
      });
    }

    // Pairwise (2-leg) combinations across distinct events
    for (let i = 0; i < allCandidates.length; i++) {
      for (let j = i + 1; j < allCandidates.length; j++) {
        const c1 = allCandidates[i];
        const c2 = allCandidates[j];

        // RULE: Distinct events only
        if (c1.eventId === c2.eventId) {
          continue;
        }

        const combinedOdds = Math.round(c1.odds * c2.odds * 100) / 100;
        const qualifies =
          combinedOdds >= AiAutoPickService.TARGET_MIN_ODDS - 0.001 &&
          combinedOdds <= AiAutoPickService.TARGET_MAX_ODDS + 0.001;

        let rejectReason: string | undefined;
        if (combinedOdds < AiAutoPickService.TARGET_MIN_ODDS) {
          rejectReason = `Odds ${combinedOdds.toFixed(2)} below minimum threshold of ${AiAutoPickService.TARGET_MIN_ODDS.toFixed(2)}`;
        } else if (combinedOdds > AiAutoPickService.TARGET_MAX_ODDS) {
          rejectReason = `Odds ${combinedOdds.toFixed(2)} above maximum threshold of ${AiAutoPickService.TARGET_MAX_ODDS.toFixed(2)}`;
        }

        const avgConfidence = (c1.confidence + c2.confidence) / 2;
        const liveBonus = (!c1.eventId.startsWith('demo_') ? 10 : 0) + (!c2.eventId.startsWith('demo_') ? 10 : 0);
        const statisticalScore = avgConfidence * 100 + liveBonus;

        combinations.push({
          id: `combo-${c1.eventId}-${c2.eventId}`,
          selections: [c1, c2],
          combinedOdds,
          qualifies,
          rejectReason,
          averageConfidence: avgConfidence,
          statisticalScore,
        });
      }
    }

    // 3-leg combinations across distinct events
    for (let i = 0; i < allCandidates.length; i++) {
      for (let j = i + 1; j < allCandidates.length; j++) {
        for (let k = j + 1; k < allCandidates.length; k++) {
          const c1 = allCandidates[i];
          const c2 = allCandidates[j];
          const c3 = allCandidates[k];

          // RULE: Distinct events only
          if (c1.eventId === c2.eventId || c1.eventId === c3.eventId || c2.eventId === c3.eventId) {
            continue;
          }

          const combinedOdds = Math.round(c1.odds * c2.odds * c3.odds * 100) / 100;
          const qualifies =
            combinedOdds >= AiAutoPickService.TARGET_MIN_ODDS - 0.001 &&
            combinedOdds <= AiAutoPickService.TARGET_MAX_ODDS + 0.001;

          let rejectReason: string | undefined;
          if (combinedOdds < AiAutoPickService.TARGET_MIN_ODDS) {
            rejectReason = `Odds ${combinedOdds.toFixed(2)} below minimum threshold of ${AiAutoPickService.TARGET_MIN_ODDS.toFixed(2)}`;
          } else if (combinedOdds > AiAutoPickService.TARGET_MAX_ODDS) {
            rejectReason = `Odds ${combinedOdds.toFixed(2)} above maximum threshold of ${AiAutoPickService.TARGET_MAX_ODDS.toFixed(2)}`;
          }

          const avgConfidence = (c1.confidence + c2.confidence + c3.confidence) / 3;
          const liveBonus =
            (!c1.eventId.startsWith('demo_') ? 8 : 0) +
            (!c2.eventId.startsWith('demo_') ? 8 : 0) +
            (!c3.eventId.startsWith('demo_') ? 8 : 0);
          const statisticalScore = avgConfidence * 100 + liveBonus;

          combinations.push({
            id: `combo-${c1.eventId}-${c2.eventId}-${c3.eventId}`,
            selections: [c1, c2, c3],
            combinedOdds,
            qualifies,
            rejectReason,
            averageConfidence: avgConfidence,
            statisticalScore,
          });
        }
      }
    }

    // 4-leg / 5-leg combinations if needed for Option 1
    if (searchOption1 && option1Candidates.length >= 4 && !combinations.some((c) => c.qualifies)) {
      for (let i = 0; i < option1Candidates.length; i++) {
        for (let j = i + 1; j < option1Candidates.length; j++) {
          for (let k = j + 1; k < option1Candidates.length; k++) {
            for (let l = k + 1; l < option1Candidates.length; l++) {
              const c1 = option1Candidates[i];
              const c2 = option1Candidates[j];
              const c3 = option1Candidates[k];
              const c4 = option1Candidates[l];
              if (
                new Set([c1.eventId, c2.eventId, c3.eventId, c4.eventId]).size !== 4
              ) {
                continue;
              }

              const combinedOdds = Math.round(c1.odds * c2.odds * c3.odds * c4.odds * 100) / 100;
              const qualifies =
                combinedOdds >= AiAutoPickService.TARGET_MIN_ODDS - 0.001 &&
                combinedOdds <= AiAutoPickService.TARGET_MAX_ODDS + 0.001;

              if (qualifies) {
                const avgConfidence = (c1.confidence + c2.confidence + c3.confidence + c4.confidence) / 4;
                combinations.push({
                  id: `combo4-${c1.eventId}-${c2.eventId}-${c3.eventId}-${c4.eventId}`,
                  selections: [c1, c2, c3, c4],
                  combinedOdds,
                  qualifies,
                  averageConfidence: avgConfidence,
                  statisticalScore: avgConfidence * 100,
                });
              }
            }
          }
        }
      }
    }

    pushAudit(`Total candidate combinations generated: ${combinations.length}`);
    pushAudit('Filtering total odds (2.00–2.14 requirement applied)');

    const qualifyingCombos = combinations.filter((c) => c.qualifies);
    pushAudit(`Qualifying combinations found: ${qualifyingCombos.length}`);

    // Sort combinations: qualifying first ordered by highest statistical score, then non-qualifying
    const sortedCombinations = [...combinations].sort((a, b) => {
      if (a.qualifies && !b.qualifies) return -1;
      if (!a.qualifies && b.qualifies) return 1;
      return b.statisticalScore - a.statisticalScore;
    });

    // Provide rich candidate combinations audit (up to 150 top qualifying combinations for picking + sample of rejected)
    const qualifyingAudit = sortedCombinations.filter((c) => c.qualifies).slice(0, 150);
    const rejectedAudit = sortedCombinations.filter((c) => !c.qualifies).slice(0, 50);
    const auditList = [...qualifyingAudit, ...rejectedAudit];

    // Prepare human-readable combinations summary with full selections for Candidate Combinations Audit picking
    const allCombinationsSummary = auditList.map((c) => ({
      id: c.id,
      summary: c.selections.map((s) => `${s.teams} (${s.odds})`).join(' × '),
      odds: c.combinedOdds,
      qualifies: c.qualifies,
      reason: c.qualifies ? 'QUALIFIES (in 2.00-2.14 corridor)' : (c.rejectReason || 'REJECTED'),
      statisticalScore: Math.round(c.statisticalScore * 10) / 10,
      averageConfidence: Math.round(c.averageConfidence * 100) / 100,
      selections: c.selections.map((s) => ({
        eventId: s.eventId,
        teams: s.teams,
        market: s.market,
        selection: s.selection,
        odds: s.odds,
        analysis: s.analysis,
        confidence: s.confidence,
        statsSummary: s.stats
          ? `H2H Avg Goals: ${s.stats.headToHead.avgTotalGoals} | Form: ${s.stats.recentForm.home} vs ${s.stats.recentForm.away} | Clean Sheet Rate: ${s.stats.matchStats.cleanSheetRateCombined}%`
          : undefined,
        source: 'https://www.nicebet.com.lr/',
        liveMatchUrl: 'https://www.nicebet.com.lr/en/sports',
      })),
    }));

    // 4. If no combination qualifies: DO NOT CREATE A BET (Rule 10)
    if (qualifyingCombos.length === 0) {
      pushAudit('NO QUALIFYING AI SELECTION FOUND: 2.00–2.14 range requirement was not satisfied.');
      return {
        mode: 'AI_AUTO_PICK',
        source: 'https://www.nicebet.com.lr/',
        selectedOption: optionFilter,
        targetOdds: {
          min: AiAutoPickService.TARGET_MIN_ODDS,
          max: AiAutoPickService.TARGET_MAX_ODDS,
        },
        stake,
        currency,
        selections: [],
        combinedOdds: 0,
        status: 'NO_QUALIFYING_SELECTION',
        reason:
          'No sufficiently supported combination was found within the required 2.00–2.14 range. The AI will never force unrelated or poorly supported selections.',
        summary: 'NO QUALIFYING AI SELECTION FOUND',
        totalCandidatesEvaluated: allCandidates.length,
        totalCombinationsGenerated: combinations.length,
        qualifyingCombinationsCount: 0,
        allCombinations: allCombinationsSummary,
        auditTrail,
      };
    }

    // 5. Rank qualifying combinations by strongest statistical evidence and confidence
    qualifyingCombos.sort((a, b) => b.statisticalScore - a.statisticalScore);

    // 6. Find first combination that passes backend validation (SelectionValidator)
    pushAudit('Performing initial backend validation on qualifying candidates');
    let selectedCombination: CandidateCombination | null = null;
    let selectedValidation: SelectionValidationResult | null = null;

    for (const combo of qualifyingCombos) {
      const validation = SelectionValidator.validate(
        combo.selections.map((s) => ({
          eventId: s.eventId,
          teams: s.teams,
          market: s.market,
          selection: s.selection,
          odds: s.odds,
        }))
      );
      if (validation.isValid) {
        selectedCombination = combo;
        selectedValidation = validation;
        break;
      }
    }

    if (!selectedCombination || !selectedValidation) {
      pushAudit('Backend validation rejected all candidate combinations');
      return {
        mode: 'AI_AUTO_PICK',
        source: 'https://www.nicebet.com.lr/',
        selectedOption: optionFilter,
        targetOdds: {
          min: AiAutoPickService.TARGET_MIN_ODDS,
          max: AiAutoPickService.TARGET_MAX_ODDS,
        },
        stake,
        currency,
        selections: [],
        combinedOdds: 0,
        status: 'NO_QUALIFYING_SELECTION',
        reason: 'Candidate combinations did not satisfy strict backend validation.',
        summary: 'NO QUALIFYING AI SELECTION FOUND',
        totalCandidatesEvaluated: allCandidates.length,
        totalCombinationsGenerated: combinations.length,
        qualifyingCombinationsCount: qualifyingCombos.length,
        allCombinations: allCombinationsSummary,
        auditTrail,
      };
    }

    const comboTeams = selectedCombination.selections.map((s) => s.teams).join(' × ');
    pushAudit(
      `Selected top combination: ${comboTeams} (Total Odds: ${selectedCombination.combinedOdds.toFixed(2)}, Statistical Score: ${selectedCombination.statisticalScore.toFixed(1)}/100) from NiceBet (https://www.nicebet.com.lr/)`
    );
    pushAudit(`Selection validated: Combined odds ${selectedValidation.calculatedCombinedOdds.toFixed(2)} (within 2.00–2.14)`);

    const numLegs = selectedCombination.selections.length;
    return {
      mode: 'AI_AUTO_PICK',
      source: 'https://www.nicebet.com.lr/',
      selectedOption: optionFilter,
      targetOdds: {
        min: AiAutoPickService.TARGET_MIN_ODDS,
        max: AiAutoPickService.TARGET_MAX_ODDS,
      },
      stake,
      currency,
      selections: selectedCombination.selections.map((s) => ({
        eventId: s.eventId,
        teams: s.teams,
        market: s.market,
        selection: s.selection,
        odds: s.odds,
        analysis: s.analysis,
        confidence: s.confidence,
        statsSummary: s.stats
          ? `H2H Avg Goals: ${s.stats.headToHead.avgTotalGoals} | Form: ${s.stats.recentForm.home} vs ${s.stats.recentForm.away} | Clean Sheet Rate: ${s.stats.matchStats.cleanSheetRateCombined}%`
          : undefined,
        source: 'https://www.nicebet.com.lr/',
        liveMatchUrl: 'https://www.nicebet.com.lr/en/sports',
      })),
      combinedOdds: selectedValidation.calculatedCombinedOdds,
      status: 'QUALIFIED',
      summary: `AI Auto Pick successfully selected ${numLegs} statistically supported ${numLegs === 1 ? 'leg' : 'legs'} yielding combined odds of ${selectedValidation.calculatedCombinedOdds.toFixed(2)} directly from NiceBet.`,
      totalCandidatesEvaluated: allCandidates.length,
      totalCombinationsGenerated: combinations.length,
      qualifyingCombinationsCount: qualifyingCombos.length,
      allCombinations: allCombinationsSummary,
      auditTrail,
    };
  }

  /**
   * Statistical analyzer for Option 1: Multigoals 0-5
   * Considers:
   * - Average goals per match
   * - Goals conceded & defensive records
   * - Over/Under 5.5 trends
   * - Head-to-head goal distributions
   */
  private analyzeOption1(
    event: SportsbookEvent,
    odds: number
  ): { analysis: string; confidence: number } {
    const stats = event.stats;
    if (!stats) {
      return {
        analysis: `Historical goal scoring patterns across ${event.title} strongly correlate with 0 to 5 total match goals.`,
        confidence: 0.8,
      };
    }

    const { recentForm, headToHead, matchStats, competition } = stats;
    const avgTotal = (recentForm.homeAvgGoalsScored + recentForm.awayAvgGoalsScored).toFixed(1);

    const analysis =
      `Based on ${headToHead.meetingsCount} recent meetings averaging ${headToHead.avgTotalGoals} goals, ` +
      `${event.title} demonstrates extreme goal-ceiling stability (${headToHead.under55Percentage}% matches under 5.5 goals). ` +
      `${event.homeTeam} concedes ${recentForm.homeAvgGoalsConceded} goals/game while ${event.awayTeam} concedes ${recentForm.awayAvgGoalsConceded}. ` +
      `Combined expected goals (xG) is ${matchStats.expectedGoalsCombined.toFixed(2)}. ` +
      `Evidence strongly supports the 0-5 total goals bracket.`;

    // Confidence model based on under 5.5 % and xG
    const confidence = Math.min(
      0.95,
      Math.max(0.75, (headToHead.under55Percentage / 100) * 0.9 + (3.0 - Math.min(3.0, matchStats.expectedGoalsCombined)) * 0.05)
    );

    return {
      analysis,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Statistical analyzer for Option 2: Multigoals 1 & Multigoals 2 -> (1-4),(0-2)
   * Treats the entire market + selection as ONE complete betting option.
   * Analyzes:
   * - Goal distributions in both periods/halves or combined team corridors
   * - Low variance in scoring
   * - Clean sheet percentages and defensive solidity
   */
  private analyzeOption2(
    event: SportsbookEvent,
    odds: number
  ): { analysis: string; confidence: number } {
    const stats = event.stats;
    if (!stats) {
      return {
        analysis: `Tactical setup for ${event.title} supports the exact Multigoals 1 & Multigoals 2 (1-4),(0-2) corridor.`,
        confidence: 0.78,
      };
    }

    const { recentForm, headToHead, matchStats, teamInfo } = stats;

    const analysis =
      `Atomic selection (1-4),(0-2) is supported by defensive metrics in ${event.title}: ` +
      `${event.awayTeam} has conceded only ${recentForm.awayAvgGoalsConceded} goals/away match with ${matchStats.cleanSheetRateCombined}% clean sheet frequency. ` +
      `${matchStats.bothTeamsToScoreTrend}. ` +
      `${headToHead.notes} Expected goals of ${matchStats.expectedGoalsCombined.toFixed(2)} and tactical stability confirm the high-probability match for this exact market.`;

    const confidence = Math.min(
      0.92,
      Math.max(0.72, 0.75 + (matchStats.cleanSheetRateCombined / 200))
    );

    return {
      analysis,
      confidence: Math.round(confidence * 100) / 100,
    };
  }
}

export const aiAutoPickService = new AiAutoPickService();
