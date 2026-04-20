import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Scenario, YearlyData } from '../types';

interface Props {
  scenarios: Scenario[];
  dataMap: Record<string, YearlyData[]>;
}

const fmt = (v: number) => `${(v / 10000).toFixed(0)}万`;

export function LineChartView({ scenarios, dataMap }: Props) {
  const [showReal, setShowReal] = useState(false);
  const [inflationRate, setInflationRate] = useState(2);
  const maxYears = Math.max(...scenarios.map(s => s.years));
  const merged = Array.from({ length: maxYears }, (_, i) => {
    const year = i + 1;
    const point: Record<string, number | string> = { year: `${year}年` };
    for (const s of scenarios) {
      const d = dataMap[s.id]?.find(d => d.year === year);
      if (d) {
        point[s.name] = d.total;
        if (showReal) {
          point[`${s.name}（実質）`] = Math.round(d.total / Math.pow(1 + inflationRate / 100, year));
        }
      }
    }
    return point;
  });

  return (
    <div>
      <div className="inflation-controls">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={showReal} onChange={e => setShowReal(e.target.checked)} />
          インフレ調整後の実質価値を表示
        </label>
        {showReal && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            年率
            <input
              type="number" min={0} max={20} step={0.1} value={inflationRate}
              onChange={e => setInflationRate(Number(e.target.value))}
              style={{ width: 60, padding: '2px 6px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
            />
            %
          </label>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={merged} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={fmt} />
          <Tooltip formatter={(v) => fmt(Number(v))} />
          <Legend />
          {scenarios.map(s => (
            <Line key={s.id} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={false} />
          ))}
          {showReal && scenarios.map(s => (
            <Line key={`${s.id}-real`} type="monotone" dataKey={`${s.name}（実質）`}
              stroke={s.color} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FinalAmountBarChart({ scenarios, dataMap }: Props) {
  const chartData = scenarios.map(s => {
    const last = dataMap[s.id]?.at(-1);
    return {
      name: s.name,
      元本: last ? Math.round(last.principal / 10000) : 0,
      運用益: last ? Math.round(last.gain / 10000) : 0,
      color: s.color,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={v => `${v}万`} />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString()}万円`} />
        <Legend />
        <Bar dataKey="元本" stackId="a" fill="#a0aec0" />
        <Bar dataKey="運用益" stackId="a" fill="#68d391"
          label={{ position: 'top', content: (props) => {
            const index = props.index ?? 0;
            const d = chartData[index];
            const total = d.元本 + d.運用益;
            return (
              <text x={Number(props.x) + Number(props.width) / 2} y={Number(props.y) - 6}
                textAnchor="middle" fontSize={12} fill="#333">
                {`${total.toLocaleString()}万`}
              </text>
            );
          }}}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StackedBarChartView({ scenario, data }: { scenario: Scenario; data: YearlyData[] }) {
  const chartData = data.map(d => ({
    year: `${d.year}年`,
    元本: Math.round(d.principal / 10000),
    運用益: Math.round(d.gain / 10000),
  }));

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ color: scenario.color, marginBottom: 8 }}>{scenario.name}：元本 vs 運用益</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={v => `${v}万`} />
          <Tooltip formatter={(v) => `${Number(v)}万円`} />
          <Legend />
          <Bar dataKey="元本" stackId="a" fill="#a0aec0" />
          <Bar dataKey="運用益" stackId="a" fill={scenario.color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
