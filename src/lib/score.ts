// Faixas do Match Score. Uma unica fonte para a cor do numero (classe) e para
// a cor do anel (hexadecimal), com os mesmos limites.
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-jm-purple';
  if (score >= 60) return 'text-jm-teal';
  if (score >= 40) return 'text-jm-orange';
  return 'text-jm-red';
}

export function getScoreHex(score: number): string {
  if (score >= 80) return '#7C5CFF';
  if (score >= 60) return '#14B8A6';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}
