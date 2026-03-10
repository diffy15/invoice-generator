import React, { useMemo } from 'react';

// ── Indian FY: Apr → Mar ──────────────────────────────────────
export const FY_MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

export const QUARTERS = [
  { key: 'Q1', label: 'Q1', desc: 'Apr – Jun', months: ['Apr','May','Jun'] },
  { key: 'Q2', label: 'Q2', desc: 'Jul – Sep', months: ['Jul','Aug','Sep'] },
  { key: 'Q3', label: 'Q3', desc: 'Oct – Dec', months: ['Oct','Nov','Dec'] },
  { key: 'Q4', label: 'Q4', desc: 'Jan – Mar', months: ['Jan','Feb','Mar'] },
];

export const HALVES = [
  { key: 'H1', label: 'H1 (Apr – Sep)', quarters: ['Q1','Q2'] },
  { key: 'H2', label: 'H2 (Oct – Mar)', quarters: ['Q3','Q4'] },
];

const fc = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n || 0);

// ── Build default 12-entry array for a given FY start year ───
export const buildDefaultTargets = (fyStartYear) => {
  const year = fyStartYear ?? (() => {
    const now = new Date();
    return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  })();
  return FY_MONTHS.map(month => ({
    month,
    year: ['Jan','Feb','Mar'].includes(month) ? year + 1 : year,
    target: 0,
  }));
};

// ── Merge saved targets with a FY skeleton ───────────────────
export const mergeTargets = (saved = [], fyStartYear) => {
  const defaults = buildDefaultTargets(fyStartYear);
  if (!saved || saved.length === 0) return defaults;
  return defaults.map(d => {
    const s = saved.find(t => t.month === d.month && t.year === d.year);
    return s ? { ...d, target: Number(s.target) || 0 } : d;
  });
};

// ── Generate FY options: 3 years back, 2 years forward ───────
export const getFYOptions = () => {
  const now = new Date();
  const currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const options = [];
  for (let y = currentFY - 3; y <= currentFY + 2; y++) {
    options.push({
      value: y,
      label: `FY ${y}–${String(y + 1).slice(-2)}`,
      isCurrent: y === currentFY,
    });
  }
  return options;
};

// ─────────────────────────────────────────────────────────────
const SalesTargetsCard = ({ monthlyTargets = [], onChange, selectedFY, onFYChange }) => {
  const targets = useMemo(() => mergeTargets(monthlyTargets, selectedFY), [monthlyTargets, selectedFY]);

  const fyStart = selectedFY ?? (targets.find(t => t.month === 'Apr')?.year);
  const fyOptions = getFYOptions();

  const getT = (month) => targets.find(t => t.month === month)?.target || 0;

  const setT = (month, raw) => {
    const val = parseFloat(raw) || 0;
    onChange(targets.map(t => t.month === month ? { ...t, target: val } : t));
  };

  const qTotals = QUARTERS.map(q => ({
    ...q,
    total: q.months.reduce((s, m) => s + getT(m), 0),
  }));

  const h1     = qTotals[0].total + qTotals[1].total;
  const h2     = qTotals[2].total + qTotals[3].total;
  const annual = h1 + h2;

  return (
    <div className="card">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold">Sales Targets</h2>

        <select
          value={fyStart || ''}
          onChange={e => onFYChange && onFYChange(Number(e.target.value))}
          className="text-xs font-semibold px-3 py-1 rounded-full cursor-pointer outline-none"
          style={{
            background: 'rgba(168,216,184,0.4)',
            color: '#14532d',
            border: '1px solid #A8D8B8',
          }}
        >
          {fyOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}{opt.isCurrent ? ' (Current)' : ''}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Enter a target for each month — quarters, half-years and annual total calculate automatically.
      </p>

      {/* ── 4-Quarter Grid ── */}
      <div className="space-y-3">
        {qTotals.map((q) => (
          <div key={q.key} className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #C8DDD4' }}>
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'rgba(200,240,216,0.35)' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-800">{q.label}</span>
                <span className="text-xs text-gray-500">{q.desc}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Quarter total</span>
                <span className="text-sm font-bold text-green-800">{fc(q.total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3" style={{ borderTop: '1px solid #C8DDD4' }}>
              {q.months.map((month, idx) => (
                <div key={month} className="p-3"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    borderLeft: idx > 0 ? '1px solid #C8DDD4' : 'none',
                  }}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{month}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">₹</span>
                    <input
                      type="number"
                      value={getT(month) || ''}
                      onChange={e => setT(month, e.target.value)}
                      min="0"
                      step="1"
                      placeholder="0"
                      className="input-field text-sm pl-6"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Summary strip ── */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { label: 'Q1 + Q2  ·  H1', sub: 'Apr – Sep', value: h1,     c: '#1d4ed8', bg: '#EFF6FF', bc: '#bfdbfe' },
          { label: 'Q3 + Q4  ·  H2', sub: 'Oct – Mar', value: h2,     c: '#7c3aed', bg: '#FAF5FF', bc: '#ddd6fe' },
          { label: 'H1 + H2',        sub: 'Annual',     value: annual, c: '#14532d', bg: '#F0FDF4', bc: '#A8D8B8' },
          { label: 'Monthly avg',    sub: 'Per month',  value: Math.round(annual / 12), c: '#92400e', bg: '#FFFBEB', bc: '#fcd34d' },
        ].map(({ label, sub, value, c, bg, bc }) => (
          <div key={label} className="rounded-xl p-3 text-center"
            style={{ background: bg, border: `1px solid ${bc}` }}>
            <p className="text-xs font-medium" style={{ color: c }}>{label}</p>
            <p className="text-xs text-gray-400 mb-1">{sub}</p>
            <p className="text-sm font-bold" style={{ color: c }}>{fc(value)}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Quarter totals, H1, H2 and Annual update automatically as you type · Saved with Company Settings
      </p>
    </div>
  );
};

export default SalesTargetsCard;