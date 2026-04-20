import type { Scenario, TaxMode } from '../types';

interface Props {
  scenario: Scenario;
  onChange: (s: Scenario) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function ScenarioForm({ scenario, onChange, onRemove, canRemove }: Props) {
  const set = (key: keyof Scenario, value: unknown) =>
    onChange({ ...scenario, [key]: value });

  return (
    <div className="scenario-form" style={{ border: `2px solid ${scenario.color}` }}>
      <div className="scenario-form-header">
        <input
          value={scenario.name}
          onChange={e => set('name', e.target.value)}
          style={{ fontWeight: 'bold', fontSize: 16, border: 'none', borderBottom: '1px solid #ccc', background: 'transparent', color: scenario.color, minWidth: 0 }}
        />
        {canRemove && (
          <button className="btn-delete" onClick={onRemove}>削除</button>
        )}
      </div>

      <div className="scenario-inputs">
        <label>
          初期投資額（万円）
          <input type="number" min={0} value={scenario.initialAmount / 10000}
            onChange={e => set('initialAmount', Number(e.target.value) * 10000)}
            className="field-input" />
        </label>
        <label>
          月額積立額（万円）
          <input type="number" min={0} step={0.5} value={scenario.monthlyAmount / 10000}
            onChange={e => set('monthlyAmount', Number(e.target.value) * 10000)}
            className="field-input" />
        </label>
        <label>
          年利（%）
          <input type="number" min={0} max={30} step={0.1} value={scenario.annualRate}
            onChange={e => set('annualRate', Number(e.target.value))}
            className="field-input" />
        </label>
        <label>
          積立期間（年）
          <input type="number" min={1} max={60} value={scenario.years}
            onChange={e => set('years', Number(e.target.value))}
            className="field-input" />
        </label>
        <label className="span-2" style={{ gridColumn: 'span 2' }}>
          税制
          <select value={scenario.taxMode} onChange={e => set('taxMode', e.target.value as TaxMode)} className="field-input">
            <option value="nisa">NISA（非課税）</option>
            <option value="tokutei">特定口座（20.315%課税）</option>
          </select>
        </label>
      </div>
    </div>
  );
}
