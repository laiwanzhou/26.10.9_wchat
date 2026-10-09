export function gradeAnswer(answer: string, accepted: string[]): boolean {
  const normalized = answer.trim();
  return (
    normalized.length > 0 &&
    accepted.some((value) => value.trim() === normalized)
  );
}
export function summarize(results: (boolean | null)[]): {
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  accuracy: number;
} {
  const answered = results.filter((value) => value !== null).length;
  const correct = results.filter((value) => value === true).length;
  return {
    total: results.length,
    answered,
    correct,
    wrong: answered - correct,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
  };
}
