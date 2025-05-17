// Deprecated

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const HAND_NAMES = [
  'High Card',
  'One Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush'
];

function cardValue(card) {
  return RANKS.indexOf(card[0]);
}

function getCombinations(arr, k) {
  const result = [];
  const comb = (start, chosen) => {
    if (chosen.length === k) {
      result.push(chosen);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      comb(i + 1, chosen.concat([arr[i]]));
    }
  };
  comb(0, []);
  return result;
}

function getHandRank(cards) {
  const values = cards.map(c => c[0]);
  const suits = cards.map(c => c[1]);
  const valueCounts = {};
  const suitCounts = {};

  for (let v of values) valueCounts[v] = (valueCounts[v] || 0) + 1;
  for (let s of suits) suitCounts[s] = (suitCounts[s] || 0) + 1;

  const isFlush = Object.values(suitCounts).some(count => count === 5);
  const sortedVals = [...new Set(values.map(v => RANKS.indexOf(v)).sort((a, b) => a - b))];
  const isLowStraight = JSON.stringify(sortedVals) === JSON.stringify([0, 1, 2, 3, 12]);
  const isStraight = sortedVals.length === 5 &&
    (sortedVals[4] - sortedVals[0] === 4 || isLowStraight);

  const counts = Object.values(valueCounts).sort((a, b) => b - a);
  const rankGroups = Object.entries(valueCounts).sort((a, b) =>
    b[1] - a[1] || RANKS.indexOf(b[0]) - RANKS.indexOf(a[0])
  );

  const rank = (() => {
    if (isFlush && isStraight) return [8, sortedVals[4]];
    if (counts[0] === 4) return [7, RANKS.indexOf(rankGroups[0][0])];
    if (counts[0] === 3 && counts[1] === 2) return [6, RANKS.indexOf(rankGroups[0][0])];
    if (isFlush) return [5, ...sortedVals.reverse()];
    if (isStraight) return [4, sortedVals[4]];
    if (counts[0] === 3) return [3, RANKS.indexOf(rankGroups[0][0])];
    if (counts[0] === 2 && counts[1] === 2) return [2, RANKS.indexOf(rankGroups[0][0]), RANKS.indexOf(rankGroups[1][0])];
    if (counts[0] === 2) return [1, RANKS.indexOf(rankGroups[0][0])];
    return [0, ...sortedVals.reverse()];
  })();

  return { rank, name: HAND_NAMES[rank[0]] };
}

function compareHands(rankA, rankB) {
  for (let i = 0; i < Math.max(rankA.length, rankB.length); i++) {
    const a = rankA[i] || 0;
    const b = rankB[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

export function evaluateWinner(communityCards, players) {
  const holeCardsList = players.map(player => player.hand);
  const results = [];

  for (let i = 0; i < holeCardsList.length; i++) {
    const playerCards = holeCardsList[i];
    const allCards = [...communityCards, ...playerCards];
    const allCombos = getCombinations(allCards, 5);
    const handEvaluations = allCombos.map(getHandRank);
    const best = handEvaluations.sort((a, b) => compareHands(a.rank, b.rank)).pop();

    results.push({
      player: players[i].name,
      rank: best.rank,
      name: best.name
    });
  }

  const sorted = [...results].sort((a, b) => compareHands(a.rank, b.rank)).reverse();
  const bestRank = sorted[0].rank;
  const winners = sorted.filter(r => compareHands(r.rank, bestRank) === 0).map(r => r.player);

  return {
    winners,
    playerHands: results
  };
}