export type TaxMode = 'nisa' | 'tokutei';

export interface Scenario {
  id: string;
  name: string;
  initialAmount: number;
  monthlyAmount: number;
  annualRate: number;
  years: number;
  taxMode: TaxMode;
  color: string;
}

export interface YearlyData {
  year: number;
  principal: number;
  total: number;
  gain: number;
}
