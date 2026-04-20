import type { Scenario, YearlyData } from './types';

const TAX_RATE = 0.20315;

export function simulate(scenario: Scenario): YearlyData[] {
  const { initialAmount, monthlyAmount, annualRate, years, taxMode } = scenario;
  const rate = annualRate / 100;
  const result: YearlyData[] = [];

  let total = initialAmount;
  let principal = initialAmount;

  for (let year = 1; year <= years; year++) {
    principal += monthlyAmount * 12;
    total = (total + monthlyAmount * 12) * (1 + rate);

    let displayTotal = total;
    if (taxMode === 'tokutei') {
      const gain = total - principal;
      displayTotal = gain > 0 ? principal + gain * (1 - TAX_RATE) : total;
    }

    result.push({
      year,
      principal,
      total: Math.round(displayTotal),
      gain: Math.round(displayTotal - principal),
    });
  }

  return result;
}

export function calcRequiredMonthly(
  targetAmount: number,
  initialAmount: number,
  annualRate: number,
  years: number,
): number {
  const rate = annualRate / 100;
  if (rate === 0) {
    return Math.max(0, (targetAmount - initialAmount) / (years * 12));
  }
  // 終価係数から逆算: target = initial*(1+r)^n + monthly * ((1+r)^n - 1)/r * (1+r)
  const growth = Math.pow(1 + rate, years);
  const annuityFactor = (growth - 1) / rate * (1 + rate) * 12;
  const monthly = (targetAmount - initialAmount * growth) / annuityFactor;
  return Math.max(0, monthly);
}
