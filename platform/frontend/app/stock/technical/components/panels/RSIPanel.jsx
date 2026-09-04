'use client';

import { Form } from 'antd';
import { RSI_M_CONSTRAINTS } from '../../lib/config';
import NumberListInput from '../NumberListInput';

// RSI control panel: independent Pane, 1~3 RSI periods (unlike Price/MA and Volume, at
// least one period is required since the Pane has no content without a line).
const RSIPanel = ({ config, error, onChange, onErrorChange }) => (
  <div>
    <Form.Item
      label="RSI 週期（逗號分隔，1~3 個，2~90）"
      validateStatus={error ? 'error' : undefined}
      help={error}
      className="mb-0"
    >
      <NumberListInput
        value={config.M}
        constraints={RSI_M_CONSTRAINTS}
        placeholder="例如 12,24"
        onChange={(values, err) => {
          onErrorChange(err);
          if (!err) onChange({ M: values });
        }}
      />
    </Form.Item>
  </div>
);

export default RSIPanel;
