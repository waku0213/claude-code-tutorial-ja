import { useState } from 'react';
import type { Scenario } from './types';
import { simulate } from './simulator';
import { scenariosToUrl, scenariosFromUrl } from './urlState';
import { ScenarioForm } from './components/ScenarioForm';
import { LineChartView, StackedBarChartView, FinalAmountBarChart } from './components/Charts';
import { SummaryTable } from './components/SummaryTable';
import { GoalCalculator } from './components/GoalCalculator';

const COLORS = ['#3182ce', '#e53e3e', '#38a169', '#d69e2e', '#805ad5'];

let idCounter = 3;

const defaultScenarios: Scenario[] = [
  { id: '1', name: 'シナリオA', initialAmount: 0, monthlyAmount: 30000, annualRate: 3, years: 20, taxMode: 'nisa', color: COLORS[0] },
  { id: '2', name: 'シナリオB', initialAmount: 0, monthlyAmount: 30000, annualRate: 5, years: 20, taxMode: 'nisa', color: COLORS[1] },
  { id: '3', name: 'シナリオC', initialAmount: 0, monthlyAmount: 30000, annualRate: 7, years: 20, taxMode: 'nisa', color: COLORS[2] },
];

export default function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>(
    () => scenariosFromUrl() ?? defaultScenarios
  );
  const [copied, setCopied] = useState(false);

  const dataMap = Object.fromEntries(scenarios.map(s => [s.id, simulate(s)]));

  const addScenario = () => {
    const id = String(++idCounter);
    const color = COLORS[scenarios.length % COLORS.length];
    setScenarios(prev => [...prev, {
      id, name: `シナリオ${String.fromCharCode(64 + scenarios.length + 1)}`,
      initialAmount: 0, monthlyAmount: 30000, annualRate: 5, years: 20,
      taxMode: 'nisa', color,
    }]);
  };

  const updateScenario = (updated: Scenario) =>
    setScenarios(prev => prev.map(s => s.id === updated.id ? updated : s));

  const removeScenario = (id: string) =>
    setScenarios(prev => prev.filter(s => s.id !== id));

  const handleShare = async () => {
    const url = scenariosToUrl(scenarios);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app">
      <div className="app-header">
        <div>
          <h1>積み立てシミュレーター</h1>
          <p>複数シナリオを比較して将来の資産を確認できます</p>
        </div>
        <button
          className="btn-share"
          onClick={handleShare}
          style={{ background: copied ? '#38a169' : '#4a5568' }}
        >
          {copied ? '✓ コピーしました' : '🔗 URLで共有'}
        </button>
      </div>

      <div className="scenario-grid">
        {scenarios.map(s => (
          <ScenarioForm
            key={s.id}
            scenario={s}
            onChange={updateScenario}
            onRemove={() => removeScenario(s.id)}
            canRemove={scenarios.length > 1}
          />
        ))}
      </div>

      <button className="btn-primary" onClick={addScenario} style={{ marginBottom: 32, marginTop: 4 }}>
        ＋ シナリオを追加
      </button>

      <div className="section">
        <h2>結果サマリー</h2>
        <SummaryTable scenarios={scenarios} dataMap={dataMap} />
      </div>

      <div className="section">
        <h2>資産推移の比較（折れ線）</h2>
        <LineChartView scenarios={scenarios} dataMap={dataMap} />
      </div>

      <div className="section">
        <h2>最終的な資産額の比較</h2>
        <FinalAmountBarChart scenarios={scenarios} dataMap={dataMap} />
      </div>

      <div className="section">
        <h2>元本 vs 運用益（積み上げ棒）</h2>
        {scenarios.map(s => (
          <StackedBarChartView key={s.id} scenario={s} data={dataMap[s.id]} />
        ))}
      </div>

      <div className="section">
        <h2>目標金額から逆算</h2>
        <GoalCalculator />
      </div>
    </div>
  );
}
