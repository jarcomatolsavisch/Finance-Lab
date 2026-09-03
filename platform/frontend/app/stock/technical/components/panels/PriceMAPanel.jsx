'use client';

import { Form, Radio, Typography } from 'antd';
import { PRICE_MA_M_CONSTRAINTS } from '../../lib/config';
import NumberListInput from '../NumberListInput';

// Price/MA control panel: price appearance (candlestick/close) + up to 3 MA periods.
// See platform/docs/TechAnalysisSpec.md 7.1.
const PriceMAPanel = ({ config, error, onChange, onErrorChange }) => (
  <div>
    <Form.Item label="價格外觀" className="mb-2">
      <Radio.Group value={config.priceType} onChange={e => onChange({ priceType: e.target.value })}>
        <Radio value="candlestick">K 線圖</Radio>
        <Radio value="close">收盤價</Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item
      label="MA 週期（逗號分隔，最多 3 個，2~90）"
      validateStatus={error ? 'error' : undefined}
      help={error}
      className="mb-0"
    >
      <NumberListInput
        value={config.M}
        constraints={PRICE_MA_M_CONSTRAINTS}
        placeholder="例如 10,30"
        onChange={(values, err) => {
          onErrorChange(err);
          if (!err) onChange({ M: values });
        }}
      />
    </Form.Item>
    <Typography.Text type="secondary" className="text-xs">
      留空則只顯示價格，不疊加 MA 線
    </Typography.Text>
  </div>
);

export default PriceMAPanel;
