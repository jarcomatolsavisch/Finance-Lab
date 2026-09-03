'use client';

import { Form, InputNumber } from 'antd';
import { MACD_K_CONSTRAINTS, MACD_MN_CONSTRAINTS } from '../../lib/config';

// MACD control panel: M (fast) < N (slow), both 2~90; K (signal) 2~50.
// See platform/docs/TechAnalysisSpec.md 7.3.
const MACDPanel = ({ config, onChange }) => {
  const crossError = config.M != null && config.N != null && config.M >= config.N ? 'M 必須小於 N' : undefined;

  return (
    <div>
      <Form.Item label="快線週期 M" validateStatus={crossError ? 'error' : undefined} className="mb-2">
        <InputNumber
          min={MACD_MN_CONSTRAINTS.min}
          max={MACD_MN_CONSTRAINTS.max}
          precision={0}
          value={config.M}
          onChange={value => onChange({ M: value })}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        label="慢線週期 N"
        validateStatus={crossError ? 'error' : undefined}
        help={crossError}
        className="mb-2"
      >
        <InputNumber
          min={MACD_MN_CONSTRAINTS.min}
          max={MACD_MN_CONSTRAINTS.max}
          precision={0}
          value={config.N}
          onChange={value => onChange({ N: value })}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="訊號週期 K" className="mb-0">
        <InputNumber
          min={MACD_K_CONSTRAINTS.min}
          max={MACD_K_CONSTRAINTS.max}
          precision={0}
          value={config.K}
          onChange={value => onChange({ K: value })}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </div>
  );
};

export default MACDPanel;
