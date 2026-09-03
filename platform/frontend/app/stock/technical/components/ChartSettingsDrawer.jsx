'use client';

import { useState } from 'react';
import { Button, Divider, Drawer, Typography } from 'antd';
import { CHART_TYPES } from '../lib/config';
import ChartTypeSelector from './ChartTypeSelector';
import PriceMAPanel from './panels/PriceMAPanel';
import MACDPanel from './panels/MACDPanel';
import BollingerPanel from './panels/BollingerPanel';

// Volume has no parameters, so it has no panel — its visibility is controlled entirely by
// the Chart 多選器 above.
const PANELS = {
  priceMA: PriceMAPanel,
  macd: MACDPanel,
  boll: BollingerPanel,
};

// Right-side "Chart Configuration Center": a chart-type selector followed by one fixed
// panel per selected chart type (except Volume, which has none), and a draft-before-apply
// footer. See platform/docs/TechAnalysisSpec.md sections 5-9.
const ChartSettingsDrawer = ({ open, draftConfig, setDraftConfig, onCancel, onApply }) => {
  // Free-text list errors (Price/MA's M, Bollinger's std) live here rather than in
  // draftConfig, since draftConfig only ever holds successfully-parsed values.
  const [listErrors, setListErrors] = useState({});

  const toggleChart = (key, enabled) =>
    setDraftConfig(prev => ({ ...prev, charts: { ...prev.charts, [key]: { ...prev.charts[key], enabled } } }));

  const updateChart = (key, patch) =>
    setDraftConfig(prev => ({ ...prev, charts: { ...prev.charts, [key]: { ...prev.charts[key], ...patch } } }));

  const { charts } = draftConfig;
  const macdInvalid = charts.macd.enabled && charts.macd.M != null && charts.macd.N != null && charts.macd.M >= charts.macd.N;
  const canApply =
    !(charts.priceMA.enabled && listErrors.priceMA) && !(charts.boll.enabled && listErrors.boll) && !macdInvalid;

  return (
    <Drawer
      title="技術分析設定"
      open={open}
      onClose={onCancel}
      destroyOnClose
      width={420}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={onApply} disabled={!canApply}>
            套用
          </Button>
        </div>
      }
    >
      <Typography.Text strong>顯示的 Chart</Typography.Text>
      <div className="mb-3 mt-2">
        <ChartTypeSelector charts={charts} onToggle={toggleChart} />
      </div>

      {CHART_TYPES.filter(({ key }) => charts[key].enabled && PANELS[key]).map(({ key, label }) => {
        const Panel = PANELS[key];
        return (
          <div key={key}>
            <Divider className="my-3" />
            <Typography.Text strong className="block mb-2">
              {label}
            </Typography.Text>
            <Panel
              config={charts[key]}
              error={listErrors[key]}
              onChange={patch => updateChart(key, patch)}
              onErrorChange={error => setListErrors(prev => ({ ...prev, [key]: error }))}
            />
          </div>
        );
      })}
    </Drawer>
  );
};

export default ChartSettingsDrawer;
