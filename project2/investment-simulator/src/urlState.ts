import type { Scenario } from './types';

const COLORS = ['#3182ce', '#e53e3e', '#38a169', '#d69e2e', '#805ad5'];

export function scenariosToUrl(scenarios: Scenario[]): string {
  const data = scenarios.map(s => [
    s.name,
    s.initialAmount,
    s.monthlyAmount,
    s.annualRate,
    s.years,
    s.taxMode === 'nisa' ? 0 : 1,
  ]);
  const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
  const url = new URL(window.location.href);
  url.searchParams.set('s', encoded);
  return url.toString();
}

export function scenariosFromUrl(): Scenario[] | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('s');
    if (!raw) return null;
    const data = JSON.parse(decodeURIComponent(atob(raw)));
    if (!Array.isArray(data)) return null;
    return data.map((row, i) => ({
      id: String(i + 1),
      name: String(row[0]),
      initialAmount: Number(row[1]),
      monthlyAmount: Number(row[2]),
      annualRate: Number(row[3]),
      years: Number(row[4]),
      taxMode: row[5] === 0 ? 'nisa' : 'tokutei',
      color: COLORS[i % COLORS.length],
    }));
  } catch {
    return null;
  }
}
