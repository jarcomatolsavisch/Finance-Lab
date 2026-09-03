'use client';

import { Form, InputNumber, Radio } from 'antd';
import { BOLL_M_CONSTRAINTS, BOLL_STD_CONSTRAINTS } from '../../lib/config';
import NumberListInput from '../NumberListInput';

// Bollinger Bands control panel: price appearance (independent from Price/MA's),
// M (2~90), and 1~3 std multipliers (0.5~3.0). See platform/docs/TechAnalysisSpec.md 7.4.
const BollingerPanel = ({ config, error, onChange, onErrorChange }) => (
  <div>
    <Form.Item label="價格外觀" className="mb-2">
      <Radio.Group value={config.priceType} onChange={e => onChange({ priceType: e.target.value })}>
        <Radio value="candlestick">K 線圖</Radio>
        <Radio value="close">收盤價</Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item label="MA 週期 M（2~90）" className="mb-2">
      <InputNumber
        min={BOLL_M_CONSTRAINTS.min}
        max={BOLL_M_CONSTRAINTS.max}
        precision={0}
        value={config.M}
        onChange={value => onChange({ M: value })}
        style={{ width: '100%' }}
      />
    </Form.Item>

    <Form.Item
      label="標準差倍數（逗號分隔，1~3 個，0.5~3.0）"
      validateStatus={error ? 'error' : undefined}
      help={error}
      className="mb-0"
    >
      <NumberListInput
        value={config.std}
        constraints={BOLL_STD_CONSTRAINTS}
        placeholder="例如 1.5,2"
        onChange={(values, err) => {
          onErrorChange(err);
          if (!err) onChange({ std: values });
        }}
      />
    </Form.Item>
  </div>
);

export default BollingerPanel;
