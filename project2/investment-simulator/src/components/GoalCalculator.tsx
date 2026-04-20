import { useState } from 'react';
import { calcRequiredMonthly } from '../simulator';

export function GoalCalculator() {
  const [target, setTarget] = useState(3000);
  const [initial, setInitial] = useState(0);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(20);

  const monthly = calcRequiredMonthly(target * 10000, initial * 10000, rate, years);
  const manEn = (v: number) => `${(v / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}万円`;

  return (
    <div className="goal-calculator">
      <h3>目標金額から逆算</h3>
      <div className="goal-inputs">
        <label>
          目標金額（万円）
          <input type="number" min={1} value={target} onChange={e => setTarget(Number(e.target.value))} className="field-input field-input-blue" />
        </label>
        <label>
          初期投資額（万円）
          <input type="number" min={0} value={initial} onChange={e => setInitial(Number(e.target.value))} className="field-input field-input-blue" />
        </label>
        <label>
          年利（%）
          <input type="number" min={0} max={30} step={0.1} value={rate} onChange={e => setRate(Number(e.target.value))} className="field-input field-input-blue" />
        </label>
        <label>
          積立期間（年）
          <input type="number" min={1} max={60} value={years} onChange={e => setYears(Number(e.target.value))} className="field-input field-input-blue" />
        </label>
      </div>
      <div className="goal-result">
        <span style={{ color: '#4a5568' }}>{target}万円を{years}年で達成するには → </span>
        <span className="goal-result-amount">月 {manEn(monthly)}</span>
        <span style={{ color: '#4a5568' }}>の積立が必要です</span>
      </div>
    </div>
  );
}
