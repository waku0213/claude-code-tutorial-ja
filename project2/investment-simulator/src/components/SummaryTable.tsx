import type { Scenario, YearlyData } from '../types';

interface Props {
  scenarios: Scenario[];
  dataMap: Record<string, YearlyData[]>;
}

const manEn = (v: number) => `${(v / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}万円`;

export function SummaryTable({ scenarios, dataMap }: Props) {
  const rows = scenarios.map(s => {
    const last = dataMap[s.id]?.at(-1);
    const principal = last?.principal ?? 0;
    const total = last?.total ?? 0;
    const gain = last?.gain ?? 0;
    const returnRate = principal > 0 ? ((total / principal - 1) * 100) : 0;
    return { s, principal, total, gain, returnRate };
  });

  return (
    <div className="summary-table-wrap">
      <table className="summary-table">
        <thead>
          <tr>
            <th>シナリオ</th>
            <th>元本合計</th>
            <th>最終資産額</th>
            <th>運用益</th>
            <th>トータルリターン</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ s, principal, total, gain, returnRate }) => (
            <tr key={s.id}>
              <td style={{ color: s.color, fontWeight: 'bold' }}>{s.name}</td>
              <td>{manEn(principal)}</td>
              <td style={{ fontWeight: 'bold' }}>{manEn(total)}</td>
              <td style={{ color: gain >= 0 ? '#38a169' : '#e53e3e' }}>
                {gain >= 0 ? '+' : ''}{manEn(gain)}
              </td>
              <td style={{ color: returnRate >= 0 ? '#38a169' : '#e53e3e' }}>
                {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
