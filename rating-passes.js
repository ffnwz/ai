// Several model passes with different seeds, merged into one rating per item.
//
// One pass at temperature 0 still drifts by 5-10 points between otherwise equal
// prompts. Each item is rated in every pass; the stored score is the median of the
// pass scores, and the spread (max - min) records how much the passes disagreed.

function passSeeds(baseSeed, passes) {
  return Array.from({ length: Math.max(1, passes) }, (_, index) => baseSeed + index);
}

function medianScore(scores) {
  const sorted = [...scores].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

// passes: { [seed]: { [id]: { score, rationale } } } -> ratings for ids rated in every pass.
function mergePasses(passes, ids) {
  const seeds = Object.keys(passes || {});
  const ratings = {};
  if (!seeds.length) return ratings;
  for (const id of ids) {
    const rows = seeds.map((seed) => passes[seed]?.[id]).filter((row) => Number.isInteger(row?.score));
    if (rows.length !== seeds.length) continue;
    const scores = rows.map((row) => row.score);
    const score = medianScore(scores);
    const closest = rows.reduce((best, row) => (Math.abs(row.score - score) < Math.abs(best.score - score) ? row : best), rows[0]);
    ratings[id] = {
      score,
      rationale: closest.rationale,
      scores,
      spread: Math.max(...scores) - Math.min(...scores)
    };
  }
  return ratings;
}

// Problems with merged ratings, for the verify commands.
function checkMergedRatings(run) {
  if (!run?.passes) return [];
  const seeds = Object.keys(run.passes);
  const wrong = Object.entries(run.ratings || {}).filter(([id, rating]) => {
    const scores = seeds.map((seed) => run.passes[seed]?.[id]?.score);
    return scores.some((score) => !Number.isInteger(score)) || medianScore(scores) !== rating.score;
  }).map(([id]) => id);
  return wrong.length ? [`ratings that are not the median of their passes: ${wrong.slice(0, 10).join(', ')}`] : [];
}

module.exports = { passSeeds, medianScore, mergePasses, checkMergedRatings };
