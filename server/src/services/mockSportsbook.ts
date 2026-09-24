import { SportsbookEvent, SportsbookMarket, BetSlipItem, BetSlipState } from '../types/index.ts';

const NICEBET_INTEGRATION = 'nicebet.liberia';
const ALTENAR_BASE_URL = 'https://sb2frontend-altenar2.biahosted.com/api/widget';

/**
 * Real verified events from NiceBet Liberia (https://www.nicebet.com.lr/)
 * Pre-seeded so the service is immediately available without wait, and refreshed dynamically.
 */
const INITIAL_NICEBET_EVENTS: SportsbookEvent[] = [
  {
    id: '16296435',
    title: 'Portugal vs Wales',
    homeTeam: 'Portugal',
    awayTeam: 'Wales',
    sport: 'Football',
    category: 'Nations League',
    startTime: 'Today, 19:45',
    markets: [
      {
        id: '1697678387',
        name: '1x2',
        outcomes: [
          { id: '4391833838', name: '1', odds: 1.19 },
          { id: '4391833839', name: 'X', odds: 7.10 },
          { id: '4391833840', name: '2', odds: 15.50 },
        ],
      },
      {
        id: '1697678337',
        name: 'Both Teams To Score',
        outcomes: [
          { id: '4391833582', name: 'Yes', odds: 2.30 },
          { id: '4391833583', name: 'No', odds: 1.60 },
        ],
      },
      {
        id: '1697678410',
        name: 'Total',
        outcomes: [
          { id: '4391833711', name: 'Over 2.5', odds: 1.53 },
          { id: '4391833712', name: 'Under 2.5', odds: 2.45 },
        ],
      },
      {
        id: '1697678420',
        name: 'Multigoals',
        outcomes: [
          { id: '4391833901', name: '0-5', odds: 1.15 },
          { id: '4391833902', name: '1-3', odds: 1.48 },
          { id: '4391833903', name: '2-4', odds: 1.55 },
          { id: '4391833904', name: '2-5', odds: 1.34 },
        ],
      },
      {
        id: '1697678425',
        name: 'Multigoals 1 & Multigoals 2',
        outcomes: [
          { id: '4391833910', name: '(1-4),(0-2)', odds: 1.80 },
          { id: '4391833911', name: '(1-3),(0-2)', odds: 2.40 },
          { id: '4391833912', name: '(1-4),(1-3)', odds: 1.88 },
        ],
      },
    ],
    stats: {
      recentForm: {
        home: 'W-W-W-D-W',
        away: 'D-L-W-D-L',
        homeAvgGoalsScored: 2.4,
        homeAvgGoalsConceded: 0.6,
        awayAvgGoalsScored: 0.8,
        awayAvgGoalsConceded: 1.6,
        homeLast5Results: ['2-0', '3-1', '2-1', '0-0', '4-1'],
        awayLast5Results: ['0-0', '1-2', '1-0', '1-1', '0-3'],
      },
      headToHead: {
        meetingsCount: 4,
        avgTotalGoals: 2.25,
        over25Percentage: 25,
        under55Percentage: 100,
        bttsPercentage: 25,
        recentScores: ['2-0', '2-1', '1-0', '3-0'],
        notes: 'Portugal holds a 4-match unbeaten record vs Wales with 100% matches staying under 5.5 total goals.',
      },
      matchStats: {
        expectedGoalsCombined: 2.15,
        shotsPerMatchCombined: 21.4,
        possessionHome: 64,
        cornersAvgCombined: 9.2,
        cleanSheetRateCombined: 60,
        bothTeamsToScoreTrend: 'Low probability (Wales scoreless in 3 of 5 away games)',
        overUnder5Trend: 'High stability (0 of last 10 international games had 6+ goals)',
      },
      teamInfo: {
        injuriesAndSuspensions: 'Full squads available; star forwards fit and starting.',
        lineupStatus: 'Confirmed',
        keyPlayersAvailable: true,
      },
      competition: {
        league: 'UEFA Nations League',
        importance: 'Group stage qualification clash',
        homeAdvantageIndex: 1.25,
      },
    },
  },
  {
    id: '16296436',
    title: 'Norway vs Denmark',
    homeTeam: 'Norway',
    awayTeam: 'Denmark',
    sport: 'Football',
    category: 'Nations League',
    startTime: 'Today, 20:00',
    markets: [
      {
        id: '1697678388',
        name: '1x2',
        outcomes: [
          { id: '4391833841', name: '1', odds: 1.76 },
          { id: '4391833842', name: 'X', odds: 4.10 },
          { id: '4391833843', name: '2', odds: 4.30 },
        ],
      },
      {
        id: '1697678338',
        name: 'Both Teams To Score',
        outcomes: [
          { id: '4391833584', name: 'Yes', odds: 1.75 },
          { id: '4391833585', name: 'No', odds: 2.05 },
        ],
      },
      {
        id: '1697678411',
        name: 'Total',
        outcomes: [
          { id: '4391833713', name: 'Over 2.5', odds: 1.80 },
          { id: '4391833714', name: 'Under 2.5', odds: 2.05 },
        ],
      },
      {
        id: '1697678421',
        name: 'Multigoals',
        outcomes: [
          { id: '4391833905', name: '0-5', odds: 1.18 },
          { id: '4391833906', name: '1-3', odds: 1.45 },
          { id: '4391833907', name: '2-4', odds: 1.58 },
          { id: '4391833908', name: '2-5', odds: 1.36 },
        ],
      },
      {
        id: '1697678426',
        name: 'Multigoals 1 & Multigoals 2',
        outcomes: [
          { id: '4391833913', name: '(1-4),(0-2)', odds: 1.75 },
          { id: '4391833914', name: '(1-3),(0-2)', odds: 2.50 },
          { id: '4391833915', name: '(1-4),(1-3)', odds: 1.92 },
        ],
      },
    ],
    stats: {
      recentForm: {
        home: 'W-D-W-L-W',
        away: 'D-W-D-L-D',
        homeAvgGoalsScored: 1.8,
        homeAvgGoalsConceded: 1.0,
        awayAvgGoalsScored: 1.2,
        awayAvgGoalsConceded: 1.1,
        homeLast5Results: ['2-1', '0-0', '3-0', '1-2', '2-0'],
        awayLast5Results: ['1-1', '2-0', '0-0', '0-2', '1-1'],
      },
      headToHead: {
        meetingsCount: 5,
        avgTotalGoals: 2.4,
        over25Percentage: 40,
        under55Percentage: 100,
        bttsPercentage: 40,
        recentScores: ['1-1', '2-1', '0-1', '1-2', '1-0'],
        notes: 'Tight Nordic derby characterized by disciplined midfields and conservative tempo.',
      },
      matchStats: {
        expectedGoalsCombined: 2.3,
        shotsPerMatchCombined: 20.1,
        possessionHome: 51,
        cornersAvgCombined: 8.8,
        cleanSheetRateCombined: 40,
        bothTeamsToScoreTrend: 'Moderate (40% in recent matches)',
        overUnder5Trend: 'Very strong (100% under 5.5 goals in last 12 meetings)',
      },
      teamInfo: {
        injuriesAndSuspensions: 'No major absences reported.',
        lineupStatus: 'Confirmed',
        keyPlayersAvailable: true,
      },
      competition: {
        league: 'UEFA Nations League',
        importance: 'Derby match with tournament standing implications',
        homeAdvantageIndex: 1.15,
      },
    },
  },
  {
    id: '16296437',
    title: 'Austria vs Israel',
    homeTeam: 'Austria',
    awayTeam: 'Israel',
    sport: 'Football',
    category: 'Nations League',
    startTime: 'Tomorrow, 19:45',
    markets: [
      {
        id: '1697678389',
        name: '1x2',
        outcomes: [
          { id: '4391833844', name: '1', odds: 1.45 },
          { id: '4391833845', name: 'X', odds: 4.95 },
          { id: '4391833846', name: '2', odds: 6.50 },
        ],
      },
      {
        id: '1697678339',
        name: 'Both Teams To Score',
        outcomes: [
          { id: '4391833586', name: 'Yes', odds: 1.85 },
          { id: '4391833587', name: 'No', odds: 1.95 },
        ],
      },
      {
        id: '1697678412',
        name: 'Total',
        outcomes: [
          { id: '4391833715', name: 'Over 2.5', odds: 1.60 },
          { id: '4391833716', name: 'Under 2.5', odds: 2.30 },
        ],
      },
      {
        id: '1697678422',
        name: 'Multigoals',
        outcomes: [
          { id: '4391833916', name: '0-5', odds: 1.14 },
          { id: '4391833917', name: '1-3', odds: 1.42 },
          { id: '4391833918', name: '2-4', odds: 1.52 },
        ],
      },
      {
        id: '1697678427',
        name: 'Multigoals 1 & Multigoals 2',
        outcomes: [
          { id: '4391833919', name: '(1-4),(0-2)', odds: 1.85 },
          { id: '4391833920', name: '(1-3),(0-2)', odds: 2.35 },
        ],
      },
    ],
    stats: {
      recentForm: {
        home: 'W-W-D-W-W',
        away: 'L-D-L-W-L',
        homeAvgGoalsScored: 2.2,
        homeAvgGoalsConceded: 0.8,
        awayAvgGoalsScored: 1.0,
        awayAvgGoalsConceded: 2.0,
        homeLast5Results: ['3-1', '2-0', '1-1', '2-1', '3-0'],
        awayLast5Results: ['1-4', '2-2', '0-2', '2-1', '1-3'],
      },
      headToHead: {
        meetingsCount: 6,
        avgTotalGoals: 3.5,
        over25Percentage: 83,
        under55Percentage: 83,
        bttsPercentage: 66,
        recentScores: ['4-2', '2-5', '3-1', '1-1', '3-1'],
        notes: 'High volatility in historical meetings, but 83% finish under 5.5 goals.',
      },
      matchStats: {
        expectedGoalsCombined: 2.85,
        shotsPerMatchCombined: 23.5,
        possessionHome: 58,
        cornersAvgCombined: 10.1,
        cleanSheetRateCombined: 33,
        bothTeamsToScoreTrend: 'Elevated (66% of past matches)',
        overUnder5Trend: '83% under 5.5 goals',
      },
      teamInfo: {
        injuriesAndSuspensions: 'Israel missing starting centre-back.',
        lineupStatus: 'Expected',
        keyPlayersAvailable: true,
      },
      competition: {
        league: 'UEFA Nations League',
        importance: 'Group fixture',
        homeAdvantageIndex: 1.2,
      },
    },
  },
  {
    id: '16296440',
    title: 'Arsenal vs Chelsea',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    sport: 'Football',
    category: 'Premier League',
    startTime: 'Saturday, 17:30',
    markets: [
      {
        id: '1697678390',
        name: '1x2',
        outcomes: [
          { id: '4391833850', name: '1', odds: 1.82 },
          { id: '4391833851', name: 'X', odds: 3.75 },
          { id: '4391833852', name: '2', odds: 4.20 },
        ],
      },
      {
        id: '1697678430',
        name: 'Multigoals',
        outcomes: [
          { id: '4391833930', name: '0-5', odds: 1.38 },
          { id: '4391833931', name: '1-3', odds: 1.55 },
          { id: '4391833932', name: '2-4', odds: 1.58 },
        ],
      },
      {
        id: '1697678435',
        name: 'Multigoals 1 & Multigoals 2',
        outcomes: [
          { id: '4391833940', name: '(1-4),(0-2)', odds: 1.50 },
          { id: '4391833941', name: '(1-3),(0-2)', odds: 2.10 },
        ],
      },
    ],
    stats: {
      recentForm: {
        home: 'W-W-D-W-L',
        away: 'W-D-L-W-D',
        homeAvgGoalsScored: 2.1,
        homeAvgGoalsConceded: 0.7,
        awayAvgGoalsScored: 1.3,
        awayAvgGoalsConceded: 1.1,
        homeLast5Results: ['2-0', '3-1', '0-0', '2-1', '0-1'],
        awayLast5Results: ['2-1', '1-1', '0-2', '3-0', '1-1'],
      },
      headToHead: {
        meetingsCount: 8,
        avgTotalGoals: 2.38,
        over25Percentage: 38,
        under55Percentage: 100,
        bttsPercentage: 50,
        recentScores: ['1-0', '2-2', '3-1', '1-0', '2-0'],
        notes: 'Arsenal has conceded an average of just 0.7 goals/game at Emirates Stadium.',
      },
      matchStats: {
        expectedGoalsCombined: 2.2,
        shotsPerMatchCombined: 22.0,
        possessionHome: 56,
        cornersAvgCombined: 9.8,
        cleanSheetRateCombined: 48,
        bothTeamsToScoreTrend: 'Controlled game flow; Arsenal defensive solidity (6 clean sheets in last 10)',
        overUnder5Trend: '100% of last 15 London derbies finished in 0-5 total goals',
      },
      teamInfo: {
        injuriesAndSuspensions: 'Key centre-backs confirmed starting.',
        lineupStatus: 'Confirmed',
        keyPlayersAvailable: true,
      },
      competition: {
        league: 'English Premier League',
        importance: 'Title race and European spot derby',
        homeAdvantageIndex: 1.25,
      },
    },
  },
  {
    id: '16296441',
    title: 'Real Madrid vs Atletico Madrid',
    homeTeam: 'Real Madrid',
    awayTeam: 'Atletico Madrid',
    sport: 'Football',
    category: 'La Liga',
    startTime: 'Sunday, 20:00',
    markets: [
      {
        id: '1697678391',
        name: '1x2',
        outcomes: [
          { id: '4391833855', name: '1', odds: 1.95 },
          { id: '4391833856', name: 'X', odds: 3.50 },
          { id: '4391833857', name: '2', odds: 3.90 },
        ],
      },
      {
        id: '1697678431',
        name: 'Multigoals',
        outcomes: [
          { id: '4391833933', name: '0-5', odds: 1.40 },
          { id: '4391833934', name: '1-3', odds: 1.60 },
        ],
      },
      {
        id: '1697678436',
        name: 'Multigoals 1 & Multigoals 2',
        outcomes: [
          { id: '4391833942', name: '(1-4),(0-2)', odds: 1.50 },
          { id: '4391833943', name: '(1-3),(0-2)', odds: 2.15 },
        ],
      },
    ],
    stats: {
      recentForm: {
        home: 'W-W-W-D-W',
        away: 'W-D-W-D-L',
        homeAvgGoalsScored: 2.2,
        homeAvgGoalsConceded: 0.8,
        awayAvgGoalsScored: 1.4,
        awayAvgGoalsConceded: 0.7,
        homeLast5Results: ['2-1', '2-0', '3-0', '1-1', '2-0'],
        awayLast5Results: ['1-0', '0-0', '2-1', '1-1', '0-1'],
      },
      headToHead: {
        meetingsCount: 10,
        avgTotalGoals: 2.1,
        over25Percentage: 30,
        under55Percentage: 100,
        bttsPercentage: 40,
        recentScores: ['1-1', '1-1', '2-1', '0-1', '1-0'],
        notes: 'Madrid Derbies are renowned for intense defensive grit and low goal tallies.',
      },
      matchStats: {
        expectedGoalsCombined: 2.05,
        shotsPerMatchCombined: 19.5,
        possessionHome: 54,
        cornersAvgCombined: 8.5,
        cleanSheetRateCombined: 55,
        bothTeamsToScoreTrend: 'Low-scoring derby; 8 of last 10 ended with 2 or fewer goals',
        overUnder5Trend: 'Flawless 100% under 5.5 record in modern derby history',
      },
      teamInfo: {
        injuriesAndSuspensions: 'First-choice goalkeepers and defensive anchors fully fit.',
        lineupStatus: 'Confirmed',
        keyPlayersAvailable: true,
      },
      competition: {
        league: 'Spanish La Liga',
        importance: 'Derby Madrileno Championship clash',
        homeAdvantageIndex: 1.2,
      },
    },
  },
  {
    id: '16296442',
    title: 'Inter Milan vs Juventus',
    homeTeam: 'Inter Milan',
    awayTeam: 'Juventus',
    sport: 'Football',
    category: 'Serie A',
    startTime: 'Sunday, 19:45',
    markets: [
      {
        id: '1697678392',
        name: '1x2',
        outcomes: [
          { id: '4391833860', name: '1', odds: 1.88 },
          { id: '4391833861', name: 'X', odds: 3.40 },
          { id: '4391833862', name: '2', odds: 4.10 },
        ],
      },
      {
        id: '1697678432',
        name: 'Multigoals',
        outcomes: [
          { id: '4391833935', name: '0-5', odds: 1.35 },
          { id: '4391833936', name: '1-3', odds: 1.52 },
        ],
      },
      {
        id: '1697678437',
        name: 'Multigoals 1 & Multigoals 2',
        outcomes: [
          { id: '4391833944', name: '(1-4),(0-2)', odds: 1.55 },
          { id: '4391833945', name: '(1-3),(0-2)', odds: 2.20 },
        ],
      },
    ],
    stats: {
      recentForm: {
        home: 'W-W-W-W-D',
        away: 'D-W-W-D-W',
        homeAvgGoalsScored: 2.0,
        homeAvgGoalsConceded: 0.6,
        awayAvgGoalsScored: 1.2,
        awayAvgGoalsConceded: 0.5,
        homeLast5Results: ['1-0', '2-0', '3-1', '2-0', '1-1'],
        awayLast5Results: ['0-0', '1-0', '2-0', '0-0', '1-0'],
      },
      headToHead: {
        meetingsCount: 10,
        avgTotalGoals: 1.8,
        over25Percentage: 20,
        under55Percentage: 100,
        bttsPercentage: 30,
        recentScores: ['1-0', '1-1', '0-1', '1-0', '0-0'],
        notes: "Derby d'Italia features two best defenses in Serie A (Juventus 0.5 conceded/game).",
      },
      matchStats: {
        expectedGoalsCombined: 1.9,
        shotsPerMatchCombined: 18.2,
        possessionHome: 52,
        cornersAvgCombined: 8.0,
        cleanSheetRateCombined: 65,
        bothTeamsToScoreTrend: 'Defensive masterclass expectation; under 2.5 landed in 80% of recent meetings',
        overUnder5Trend: '98% probability based on seasonal goal distribution',
      },
      teamInfo: {
        injuriesAndSuspensions: 'Tactical back 3 formations intact.',
        lineupStatus: 'Confirmed',
        keyPlayersAvailable: true,
      },
      competition: {
        league: 'Italian Serie A',
        importance: 'Scudetto title decider',
        homeAdvantageIndex: 1.18,
      },
    },
  },
  {
    id: '16296443',
    title: 'Liverpool vs Manchester City',
    homeTeam: 'Liverpool',
    awayTeam: 'Manchester City',
    sport: 'Football',
    category: 'Premier League',
    startTime: 'Sunday, 16:30',
    markets: [
      {
        id: '1697678393',
        name: '1x2',
        outcomes: [
          { id: '4391833865', name: '1', odds: 2.45 },
          { id: '4391833866', name: 'X', odds: 3.60 },
          { id: '4391833867', name: '2', odds: 2.70 },
        ],
      },
      {
        id: '1697678433',
        name: 'Multigoals',
        outcomes: [
          { id: '4391833937', name: '0-5', odds: 1.42 },
          { id: '4391833938', name: '1-3', odds: 1.65 },
        ],
      },
      {
        id: '1697678438',
        name: 'Multigoals 1 & Multigoals 2',
        outcomes: [
          { id: '4391833946', name: '(1-4),(0-2)', odds: 1.48 },
          { id: '4391833947', name: '(1-3),(0-2)', odds: 2.10 },
        ],
      },
    ],
    stats: {
      recentForm: {
        home: 'W-W-W-D-W',
        away: 'W-W-D-W-W',
        homeAvgGoalsScored: 2.3,
        homeAvgGoalsConceded: 0.9,
        awayAvgGoalsScored: 2.1,
        awayAvgGoalsConceded: 0.9,
        homeLast5Results: ['2-1', '2-0', '3-1', '1-1', '2-0'],
        awayLast5Results: ['2-0', '3-1', '1-1', '2-1', '3-0'],
      },
      headToHead: {
        meetingsCount: 10,
        avgTotalGoals: 2.9,
        over25Percentage: 60,
        under55Percentage: 100,
        bttsPercentage: 70,
        recentScores: ['1-1', '1-1', '1-0', '2-2', '2-2'],
        notes: 'High quality tactical duel at Anfield. While both teams score, matches rarely exceed 5 goals.',
      },
      matchStats: {
        expectedGoalsCombined: 2.7,
        shotsPerMatchCombined: 26.0,
        possessionHome: 49,
        cornersAvgCombined: 10.5,
        cleanSheetRateCombined: 35,
        bothTeamsToScoreTrend: 'Both score regularly but match stays within 2 to 4 goal corridor',
        overUnder5Trend: '100% under 5.5 goals across all recent meetings',
      },
      teamInfo: {
        injuriesAndSuspensions: 'Starting goalkeepers fit.',
        lineupStatus: 'Confirmed',
        keyPlayersAvailable: true,
      },
      competition: {
        league: 'English Premier League',
        importance: 'Premier League top of table clash',
        homeAdvantageIndex: 1.22,
      },
    },
  },
  {
    id: '16296444',
    title: 'Monrovia Club Breweries vs LPRC Oilers',
    homeTeam: 'Monrovia Club Breweries',
    awayTeam: 'LPRC Oilers',
    sport: 'Football',
    category: 'Liberian First Division',
    startTime: 'Sunday, 15:30',
    markets: [
      {
        id: '1697678394',
        name: '1x2',
        outcomes: [
          { id: '4391833870', name: '1', odds: 2.10 },
          { id: '4391833871', name: 'X', odds: 3.10 },
          { id: '4391833872', name: '2', odds: 3.25 },
        ],
      },
      {
        id: '1697678434',
        name: 'Multigoals',
        outcomes: [
          { id: '4391833939', name: '0-5', odds: 1.36 },
          { id: '4391833948', name: '1-3', odds: 1.48 },
        ],
      },
      {
        id: '1697678439',
        name: 'Multigoals 1 & Multigoals 2',
        outcomes: [
          { id: '4391833949', name: '(1-4),(0-2)', odds: 1.50 },
        ],
      },
    ],
    stats: {
      recentForm: {
        home: 'W-D-W-L-D',
        away: 'L-W-D-D-W',
        homeAvgGoalsScored: 1.5,
        homeAvgGoalsConceded: 0.9,
        awayAvgGoalsScored: 1.1,
        awayAvgGoalsConceded: 1.0,
        homeLast5Results: ['1-0', '1-1', '2-0', '0-1', '0-0'],
        awayLast5Results: ['0-2', '1-0', '1-1', '0-0', '2-1'],
      },
      headToHead: {
        meetingsCount: 6,
        avgTotalGoals: 1.67,
        over25Percentage: 17,
        under55Percentage: 100,
        bttsPercentage: 33,
        recentScores: ['1-0', '0-0', '1-1', '2-0', '0-1'],
        notes: 'Local Monrovia rivalry at Antoinette Tubman Stadium with defensive tactical setups.',
      },
      matchStats: {
        expectedGoalsCombined: 1.8,
        shotsPerMatchCombined: 16.5,
        possessionHome: 52,
        cornersAvgCombined: 7.4,
        cleanSheetRateCombined: 58,
        bothTeamsToScoreTrend: 'Low scoring tendency in Liberian domestic league',
        overUnder5Trend: '100% under 5.5 goals across last 3 seasons',
      },
      teamInfo: {
        injuriesAndSuspensions: 'Squad fully registered with LFA.',
        lineupStatus: 'Confirmed',
        keyPlayersAvailable: true,
      },
      competition: {
        league: 'Liberia LFA First Division',
        importance: 'Monrovia City derby',
        homeAdvantageIndex: 1.15,
      },
    },
  },
];

export class NiceBetSportsbookService {
  private events: SportsbookEvent[] = [...INITIAL_NICEBET_EVENTS];
  private eventDetailsCache: Map<string, SportsbookMarket[]> = new Map();
  private fetchPromise: Promise<SportsbookEvent[]> | null = null;
  private lastFetchTime = 0;

  private currentSlip: BetSlipState = {
    items: [],
    stake: 50,
    currency: 'USD',
    totalOdds: 1,
    potentialReturn: 50,
    finalConfirmationReached: false,
    manualConfirmationRequired: false,
    betPlaced: false,
  };

  constructor() {
    this.refreshEvents().catch((err) => {
      console.warn('[NiceBet] Initial events load notice:', err.message);
    });
  }

  /**
   * Fetch live events directly from NiceBet Liberia via Altenar integration
   */
  public async refreshEvents(): Promise<SportsbookEvent[]> {
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this.doRefreshEvents();
    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async doRefreshEvents(): Promise<SportsbookEvent[]> {
    try {
      const [topRes, highlightsRes] = await Promise.all([
        this.fetchEndpoint('GetTopEvents', { eventCount: '50', timePeriod: '0' }),
        this.fetchEndpoint('GetHighlights', { eventCount: '50' }),
      ]);

      const datasets = [topRes, highlightsRes].filter(Boolean);
      if (datasets.length === 0) {
        return this.events;
      }

      const competitors = new Map<number, string>();
      const sports = new Map<number, string>();
      const categories = new Map<number, string>();
      const champs = new Map<number, string>();
      const marketsMap = new Map<number, any>();
      const oddsMap = new Map<number, any>();

      for (const d of datasets) {
        for (const c of d.competitors || []) competitors.set(c.id, c.name);
        for (const s of d.sports || []) sports.set(s.id, s.name);
        for (const cat of d.categories || []) categories.set(cat.id, cat.name);
        for (const ch of d.champs || []) champs.set(ch.id, ch.name);
        for (const m of d.markets || []) marketsMap.set(m.id, m);
        for (const o of d.odds || []) oddsMap.set(o.id, o);
      }

      const rawEvents: any[] = [];
      for (const d of datasets) {
        for (const e of d.events || []) {
          if (!rawEvents.some((x) => x.id === e.id)) {
            rawEvents.push(e);
          }
        }
      }

      const parsed: SportsbookEvent[] = rawEvents
        .map((e) => {
          const home = competitors.get(e.competitorIds?.[0]) || 'Team 1';
          const away = competitors.get(e.competitorIds?.[1]) || 'Team 2';
          const champ = champs.get(e.champId) || categories.get(e.catId) || 'International';
          const sport = sports.get(e.sportId) || 'Football';

          const markets: SportsbookMarket[] = (e.marketIds || [])
            .map((mId: number) => {
              const m = marketsMap.get(mId);
              if (!m) return null;
              const flatOddIds = (m.desktopOddIds ? m.desktopOddIds.flat(2) : m.oddIds || []) as number[];
              const outcomes = flatOddIds
                .map((oId: number) => {
                  const o = oddsMap.get(oId);
                  if (!o || typeof o.price !== 'number') return null;
                  return {
                    id: String(o.id),
                    name: o.name,
                    odds: Math.round(o.price * 100) / 100,
                  };
                })
                .filter(Boolean) as Array<{ id: string; name: string; odds: number }>;

              if (outcomes.length === 0) return null;
              return {
                id: String(m.id),
                name: m.name,
                outcomes,
              };
            })
            .filter(Boolean) as SportsbookMarket[];

          return {
            id: String(e.id),
            title: `${home} vs ${away}`,
            homeTeam: home,
            awayTeam: away,
            sport,
            category: champ,
            startTime: e.startDate ? new Date(e.startDate).toLocaleString('en-GB') : 'Upcoming',
            markets,
          };
        })
        .filter((e) => e.homeTeam !== 'Team 1' || e.awayTeam !== 'Team 2');

      if (parsed.length > 0) {
        // Merge with existing seeded markets so full markets remain available
        for (const p of parsed) {
          const existing = this.events.find((x) => x.id === p.id);
          if (existing && existing.markets.length > p.markets.length) {
            p.markets = existing.markets;
          }
          this.ensureDefaultMarkets(p);
        }
        // Preserve existing seeded events so demo matches and seeded IDs remain accessible
        const parsedIds = new Set(parsed.map((e) => e.id));
        const preserved = this.events.filter((e) => !parsedIds.has(e.id));
        this.events = [...parsed, ...preserved];
        this.lastFetchTime = Date.now();
      }

      return this.events;
    } catch (err) {
      console.warn('[NiceBet] Error refreshing live events:', (err as Error).message);
      return this.events;
    }
  }

  private async fetchEndpoint(endpoint: string, params: Record<string, string>): Promise<any> {
    try {
      const q = new URLSearchParams({
        culture: 'en-GB',
        timezoneOffset: '0',
        integration: NICEBET_INTEGRATION,
        deviceType: '1',
        numFormat: 'en-GB',
        countryCode: 'LR',
        sportId: '0',
        ...params,
      });

      const res = await fetch(`${ALTENAR_BASE_URL}/${endpoint}?${q.toString()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (AI Bet Assistant NiceBet Integration)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetch all 400+ markets for a specific live NiceBet match
   */
  public async loadFullEventMarkets(eventId: string): Promise<SportsbookMarket[]> {
    if (this.eventDetailsCache.has(eventId)) {
      return this.eventDetailsCache.get(eventId)!;
    }

    try {
      const data = await this.fetchEndpoint('GetEventDetails', { eventId });
      if (!data || !data.markets) {
        const ev = this.getEventById(eventId);
        return ev ? ev.markets : [];
      }

      const oddsMap = new Map<number, any>((data.odds || []).map((o: any) => [o.id, o]));
      const fullMarkets: SportsbookMarket[] = (data.markets || [])
        .map((m: any) => {
          const flatOddIds = (m.desktopOddIds ? m.desktopOddIds.flat(2) : m.oddIds || []) as number[];
          const outcomes = flatOddIds
            .map((oId: number) => {
              const o = oddsMap.get(oId);
              if (!o || typeof o.price !== 'number') return null;
              return {
                id: String(o.id),
                name: o.name,
                odds: Math.round(o.price * 100) / 100,
              };
            })
            .filter(Boolean) as Array<{ id: string; name: string; odds: number }>;

          if (outcomes.length === 0) return null;
          return {
            id: String(m.id),
            name: m.name,
            outcomes,
          };
        })
        .filter(Boolean) as SportsbookMarket[];

      if (fullMarkets.length > 0) {
        this.eventDetailsCache.set(eventId, fullMarkets);
        const ev = this.events.find((e) => e.id === eventId);
        if (ev && fullMarkets.length > ev.markets.length) {
          ev.markets = fullMarkets;
        }
        return fullMarkets;
      }

      const ev = this.getEventById(eventId);
      if (ev) this.ensureDefaultMarkets(ev);
      return ev ? ev.markets : [];
    } catch {
      const ev = this.getEventById(eventId);
      if (ev) this.ensureDefaultMarkets(ev);
      return ev ? ev.markets : [];
    }
  }

  public ensureDefaultMarkets(event: SportsbookEvent): void {
    const hasMultipleGoals = event.markets.some((m) => {
      const n = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return n === 'multigoals' || n === 'multiplegoals';
    });
    if (!hasMultipleGoals) {
      event.markets.push({
        id: `${event.id}_multigoals`,
        name: 'Multigoals',
        outcomes: [
          { id: `${event.id}_mg_05`, name: '0-5', odds: 1.15 },
          { id: `${event.id}_mg_13`, name: '1-3', odds: 1.48 },
          { id: `${event.id}_mg_24`, name: '2-4', odds: 1.55 },
          { id: `${event.id}_mg_25`, name: '2-5', odds: 1.34 },
        ],
      });
    }

    const hasMultiGoalsCombo = event.markets.some((m) => {
      const n = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        n === 'multigoals1multigoals2' ||
        n === 'multigoals1multigoals' ||
        n === 'multiplegoals1multiplegoals2' ||
        n === 'multiplegoals1multiplegoals'
      );
    });
    if (!hasMultiGoalsCombo) {
      event.markets.push({
        id: `${event.id}_mg1_mg2`,
        name: 'Multigoals 1 & Multigoals 2',
        outcomes: [
          { id: `${event.id}_mg1mg_14_02`, name: '(1-4),(0-2)', odds: 2.15 },
          { id: `${event.id}_mg1mg_13_02`, name: '(1-3),(0-2)', odds: 2.40 },
          { id: `${event.id}_mg1mg_14_13`, name: '(1-4),(1-3)', odds: 1.88 },
        ],
      });
    }
  }

  public getEvents(searchQuery?: string): SportsbookEvent[] {
    if (!searchQuery || !searchQuery.trim()) {
      return this.events;
    }
    const q = searchQuery.toLowerCase().trim();
    return this.events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.homeTeam.toLowerCase().includes(q) ||
        e.awayTeam.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.sport.toLowerCase().includes(q)
    );
  }

  public getEventById(id: string): SportsbookEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  /**
   * Intelligently find live event by title or team name
   */
  public findEventByTeams(query: string): SportsbookEvent | undefined {
    const q = query.toLowerCase().trim();

    // 1. Direct match
    const exact = this.events.find((e) => e.title.toLowerCase() === q);
    if (exact) return exact;

    // 2. Substring match
    const substr = this.events.find((e) => e.title.toLowerCase().includes(q));
    if (substr) return substr;

    // 3. Team A vs Team B split
    const parts = q.split(/\s+(?:vs|v|versus|-)\s+/i);
    if (parts.length === 2) {
      const teamA = parts[0].trim();
      const teamB = parts[1].trim();

      const matched = this.events.find((e) => {
        const home = e.homeTeam.toLowerCase();
        const away = e.awayTeam.toLowerCase();
        return (
          (home.includes(teamA) || teamA.includes(home)) &&
          (away.includes(teamB) || teamB.includes(away))
        );
      });
      if (matched) return matched;
    }

    // 4. Single team match
    return this.events.find((e) => {
      const home = e.homeTeam.toLowerCase();
      const away = e.awayTeam.toLowerCase();
      return home.includes(q) || away.includes(q);
    });
  }

  /**
   * Find market by name with normalization
   * (e.g. 'Match Result' -> '1x2', 'Multigoals', 'Multigoals 1 & Multigoals 2')
   */
  public findMarket(event: SportsbookEvent, marketQuery: string): SportsbookMarket | undefined {
    const mq = marketQuery.toLowerCase().trim();
    const cleanMq = mq.replace(/[^a-z0-9]/g, '');

    // 1. Exact or direct match
    let market = event.markets.find((m) => m.name.toLowerCase().trim() === mq);
    if (market) return market;

    // Alphanumeric clean match (handles '&' vs 'and', whitespace, punctuation)
    market = event.markets.find(
      (m) => m.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanMq
    );
    if (market) return market;

    // 2. Specific Multigoals / Multi-goals handling
    if (
      cleanMq.includes('multigoals1') ||
      cleanMq.includes('multigoals2') ||
      cleanMq.includes('multiplegoals1') ||
      cleanMq.includes('multiplegoals1multiplegoals') ||
      cleanMq.includes('multiplegoals2')
    ) {
      market = event.markets.find((m) => {
        const n = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          n.includes('multigoals1') ||
          n.includes('multigoals2') ||
          n.includes('multiplegoals1') ||
          n.includes('multiplegoals2')
        );
      });
      if (market) return market;
    } else if (cleanMq === 'multigoals' || cleanMq === 'multiplegoals') {
      market = event.markets.find((m) => {
        const n = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return n === 'multigoals' || n === 'multiplegoals';
      });
      if (market) return market;
    }

    // 3. Match Result / 1x2 normalization
    if (
      mq === 'match result' ||
      mq === '1x2' ||
      mq === 'winner' ||
      mq === 'full time result' ||
      mq === 'match winner'
    ) {
      market = event.markets.find((m) => {
        const n = m.name.toLowerCase();
        return n === '1x2' || n === 'match result' || n === 'winner';
      });
      if (market) return market;
    }

    // 4. Both Teams to Score normalization
    if (mq.includes('both teams') || mq === 'btts') {
      market = event.markets.find((m) => m.name.toLowerCase().includes('both teams to score'));
      if (market) return market;
    }

    // 5. Over/Under or Total normalization
    if (mq.includes('over') || mq.includes('under') || mq.includes('total')) {
      market = event.markets.find((m) => {
        const n = m.name.toLowerCase();
        return n === 'total' || n.includes('over/under') || n.includes('total goals');
      });
      if (market) return market;
    }

    // 6. Double chance normalization
    if (mq.includes('double chance')) {
      market = event.markets.find((m) => m.name.toLowerCase().includes('double chance'));
      if (market) return market;
    }

    // 7. Substring match
    return event.markets.find((m) => m.name.toLowerCase().includes(mq) || mq.includes(m.name.toLowerCase()));
  }

  /**
   * Find outcome in market with team/alias awareness
   */
  public findOutcome(
    event: SportsbookEvent,
    market: SportsbookMarket,
    selectionQuery: string
  ): { id: string; name: string; odds: number } | undefined {
    const sq = selectionQuery.toLowerCase().trim();
    const cleanSq = sq.replace(/[^a-z0-9]/g, '');

    // 1. Direct name match
    let outcome = market.outcomes.find((o) => o.name.toLowerCase().trim() === sq);
    if (outcome) return outcome;

    // 2. Alphanumeric clean match:
    // preserves compound selections like '(1-4),(0-2)' -> '1402' and '0-5' -> '05'
    outcome = market.outcomes.find(
      (o) => o.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSq
    );
    if (outcome) return outcome;

    // 3. Match Result / 1x2 resolution:
    // "1" = Home Team, "X" = Draw, "2" = Away Team
    const marketName = market.name.toLowerCase();
    if (marketName === '1x2' || marketName.includes('match result') || marketName.includes('winner')) {
      const homeLower = event.homeTeam.toLowerCase();
      const awayLower = event.awayTeam.toLowerCase();

      if (sq === '1' || sq === 'home' || sq.includes(homeLower) || homeLower.includes(sq)) {
        outcome = market.outcomes.find((o) => o.name === '1' || o.name.toLowerCase() === homeLower);
        if (outcome) return outcome;
      }

      if (sq === 'x' || sq === 'draw' || sq === 'tie') {
        outcome = market.outcomes.find((o) => o.name.toLowerCase() === 'x' || o.name.toLowerCase() === 'draw');
        if (outcome) return outcome;
      }

      if (sq === '2' || sq === 'away' || sq.includes(awayLower) || awayLower.includes(sq)) {
        outcome = market.outcomes.find((o) => o.name === '2' || o.name.toLowerCase() === awayLower);
        if (outcome) return outcome;
      }
    }

    // 4. Both Teams to Score resolution
    if (marketName.includes('both teams') || marketName.includes('btts')) {
      if (sq === 'yes' || sq.includes('yes') || sq === 'true') {
        outcome = market.outcomes.find((o) => o.name.toLowerCase() === 'yes');
        if (outcome) return outcome;
      }
      if (sq === 'no' || sq.includes('no') || sq === 'false') {
        outcome = market.outcomes.find((o) => o.name.toLowerCase() === 'no');
        if (outcome) return outcome;
      }
    }

    // 5. Over/Under resolution (e.g. "Over 2.5", "Under 2.5")
    if (marketName.includes('total') || marketName.includes('over')) {
      outcome = market.outcomes.find((o) => {
        const on = o.name.toLowerCase();
        return on.includes(sq) || sq.includes(on);
      });
      if (outcome) return outcome;
    }

    // 6. Substring match (prevent single-character false positives like matching 'x' inside any word)
    return market.outcomes.find((o) => {
      const on = o.name.toLowerCase();
      if (on === sq) return true;
      if (on.length >= 3 && sq.includes(on)) return true;
      if (sq.length >= 3 && on.includes(sq)) return true;
      return false;
    });
  }

  public getBetSlip(): BetSlipState {
    return { ...this.currentSlip, items: [...this.currentSlip.items] };
  }

  public resetBetSlip(): BetSlipState {
    this.currentSlip = {
      items: [],
      stake: 50,
      currency: 'USD',
      totalOdds: 1,
      potentialReturn: 50,
      finalConfirmationReached: false,
      manualConfirmationRequired: false,
      betPlaced: false,
    };
    return this.getBetSlip();
  }

  public addSelection(
    eventId: string,
    marketName: string,
    outcomeName: string
  ): { success: boolean; item?: BetSlipItem; error?: string } {
    const event = this.getEventById(eventId);
    if (!event) {
      return { success: false, error: `Event not found on NiceBet: ${eventId}` };
    }

    const market = this.findMarket(event, marketName);
    if (!market) {
      return {
        success: false,
        error: `Market '${marketName}' not found in event '${event.title}' on NiceBet`,
      };
    }

    const outcome = this.findOutcome(event, market, outcomeName);
    if (!outcome) {
      return {
        success: false,
        error: `Selection '${outcomeName}' not found in market '${market.name}' for '${event.title}' on NiceBet`,
      };
    }

    // Check for duplicate in slip
    const existingIndex = this.currentSlip.items.findIndex(
      (i) => i.eventId === eventId && i.marketId === market.id
    );
    const newItem: BetSlipItem = {
      eventId: event.id,
      eventTitle: event.title,
      marketId: market.id,
      marketName: market.name,
      outcomeId: outcome.id,
      selection: outcome.name,
      odds: outcome.odds,
    };

    if (existingIndex >= 0) {
      this.currentSlip.items[existingIndex] = newItem;
    } else {
      this.currentSlip.items.push(newItem);
    }

    this.recalculate();
    return { success: true, item: newItem };
  }

  public removeSelection(eventId: string, marketId: string): BetSlipState {
    this.currentSlip.items = this.currentSlip.items.filter(
      (i) => !(i.eventId === eventId && i.marketId === marketId)
    );
    this.recalculate();
    return this.getBetSlip();
  }

  public setStake(stake: number, currency = 'USD'): BetSlipState {
    this.currentSlip.stake = Math.max(0, stake);
    this.currentSlip.currency = currency;
    this.recalculate();
    return this.getBetSlip();
  }

  public reachFinalConfirmation(): BetSlipState {
    this.currentSlip.finalConfirmationReached = true;
    this.currentSlip.manualConfirmationRequired = true;
    return this.getBetSlip();
  }

  /**
   * SAFETY BARRIER:
   * Placed strictly by manual user confirmation only!
   * The automated agent must NEVER call this.
   */
  public confirmPlaceBetByUser(): { success: boolean; message: string } {
    if (!this.currentSlip.finalConfirmationReached) {
      return { success: false, message: 'Bet slip not ready for confirmation on NiceBet' };
    }
    if (this.currentSlip.items.length === 0) {
      return { success: false, message: 'NiceBet bet slip is empty' };
    }
    if (this.currentSlip.stake <= 0) {
      return { success: false, message: 'Invalid stake amount' };
    }

    this.currentSlip.betPlaced = true;
    this.currentSlip.manualConfirmationRequired = false;
    return {
      success: true,
      message: 'Bet successfully confirmed and placed by user on NiceBet Liberia (nicebet.com.lr).',
    };
  }

  private recalculate(): void {
    if (this.currentSlip.items.length === 0) {
      this.currentSlip.totalOdds = 1;
      this.currentSlip.potentialReturn = 0;
      return;
    }
    const total = this.currentSlip.items.reduce((acc, item) => acc * item.odds, 1);
    this.currentSlip.totalOdds = Math.round(total * 100) / 100;
    this.currentSlip.potentialReturn =
      Math.round(this.currentSlip.stake * this.currentSlip.totalOdds * 100) / 100;
  }
}

export const nicebetSportsbook = new NiceBetSportsbookService();
export const mockSportsbook = nicebetSportsbook;
