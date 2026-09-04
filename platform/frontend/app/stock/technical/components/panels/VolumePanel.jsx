'use client';

import { Form, Typography } from 'antd';
import { VOLUME_M_CONSTRAINTS } from '../../lib/config';
import NumberListInput from '../NumberListInput';

// Volume control panel: histogram is always shown; up to 3 optional VOL_<M> moving-average
// overlay periods. See platform/docs/TechAnalysisSpec.md 7.2.
const VolumePanel = ({ config, error, onChange, onErrorChange }) => (
  <div>
    <Form.Item
      label="成交量 MA 週期（逗號分隔，最多 3 個，2~90）"
      validateStatus={error ? 'error' : undefined}
      help={error}
      className="mb-0"
    >
      <NumberListInput
        value={config.M}
        constraints={VOLUME_M_CONSTRAINTS}
        placeholder="例如 5,10"
        onChange={(values, err) => {
          onErrorChange(err);
          if (!err) onChange({ M: values });
        }}
      />
    </Form.Item>
    <Typography.Text type="secondary" className="text-xs">
      留空則只顯示成交量長條圖，不疊加均量線
    </Typography.Text>
  </div>
);

export default VolumePanel;
