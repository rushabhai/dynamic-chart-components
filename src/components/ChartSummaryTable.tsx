import React from 'react';

interface ChartSummaryTableProps {
  data: any[];
  loading?: boolean;
}

function ChartSummaryTable({ data, loading = false }: ChartSummaryTableProps) {
  if (loading) {
    return <div style={{ padding: 16, textAlign: 'center' }}>Loading summary...</div>;
  }
  const chartData = Array.isArray(data) ? data.filter(d => typeof d.label === 'string' && typeof d.value === 'number') : [];
  const labelMap = new Map();
  chartData.forEach(item => {
    if (labelMap.has(item.label)) {
      labelMap.set(item.label, labelMap.get(item.label) + item.value);
    } else {
      labelMap.set(item.label, item.value);
    }
  });
  let mergedRows = Array.from(labelMap.entries()).map(([label, value]) => ({ label, value }));
  const total = mergedRows.reduce((sum, d) => sum + d.value, 0);
  const avg = mergedRows.length ? total / mergedRows.length : 0;
  mergedRows = mergedRows.sort((a, b) => b.value - a.value);

  if (mergedRows.length === 0) {
    return <div style={{ padding: 16, textAlign: 'center', color: '#888' }}>No data available for summary.</div>;
  }

  return (
    <div style={{ overflowX: 'auto', background: '#F9F9F9', borderRadius: 16, padding: 16, marginTop: 8 }}>
      <table
        style={{ width: '100%', fontSize: 14, fontFamily: 'Figtree', borderCollapse: 'collapse' }}
        aria-label="Chart summary table"
      >
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'left' }}>Label</th>
            <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>Value</th>
            <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }} title="Percentage of total value">% of Total <span style={{ cursor: 'help', color: '#888' }}>ⓘ</span></th>
          </tr>
        </thead>
        <tbody>
          {mergedRows.map((item, idx) => (
            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f3f6fa' }}>
              <td style={{ padding: '8px 12px', fontWeight: 500 }}>{item.label}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.value}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{total ? ((item.value / total) * 100).toFixed(1) + '%' : '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ padding: '8px 12px', fontWeight: 700 }}>Total</td>
            <td style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>{total}</td>
            <td style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>100%</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', fontWeight: 700 }}>Average</td>
            <td style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>{avg.toFixed(2)}</td>
            <td style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default ChartSummaryTable;