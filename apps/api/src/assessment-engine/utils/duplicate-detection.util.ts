/**
 * Levenshtein-based near-duplicate detection for question text.
 * Used during AI question generation quality validation.
 */

/** Compute Levenshtein edit distance between two strings */
function levenshtein(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;
  const dp: number[][] = [];

  for (let i = 0; i <= aLen; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= bLen; j++) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[aLen][bLen];
}

/** Normalize similarity: 1.0 = identical, 0.0 = completely different */
export function textSimilarity(a: string, b: string): number {
  const aNorm = a.toLowerCase().trim();
  const bNorm = b.toLowerCase().trim();
  if (aNorm === bNorm) return 1.0;
  const maxLen = Math.max(aNorm.length, bNorm.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshtein(aNorm, bNorm);
  return 1 - dist / maxLen;
}

/**
 * Check if a candidate question text is a near-duplicate of any existing texts.
 * @param candidate - The new question text to check
 * @param existingTexts - Array of existing question texts in the question bank
 * @param threshold - Similarity threshold above which questions are considered duplicates (default 0.85)
 * @returns { isDuplicate, mostSimilarText, similarity }
 */
export function checkDuplicate(
  candidate: string,
  existingTexts: string[],
  threshold = 0.85,
): { isDuplicate: boolean; mostSimilarText?: string; similarity: number } {
  let maxSimilarity = 0;
  let mostSimilarText: string | undefined;

  for (const existing of existingTexts) {
    const sim = textSimilarity(candidate, existing);
    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      mostSimilarText = existing;
    }
  }

  return {
    isDuplicate: maxSimilarity >= threshold,
    mostSimilarText: maxSimilarity >= threshold ? mostSimilarText : undefined,
    similarity: maxSimilarity,
  };
}
