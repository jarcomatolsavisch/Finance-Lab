'use client';

import { Checkbox } from 'antd';
import { CHART_TYPES } from '../lib/config';

// Drawer's top-level "which of the 4 charts are shown" control.
// See platform/docs/TechAnalysisSpec.md section 6.
const ChartTypeSelector = ({ charts, onToggle }) => {
  const checkedKeys = CHART_TYPES.filter(({ key }) => charts[key].enabled).map(({ key }) => key);

  return (
    <Checkbox.Group
      value={checkedKeys}
      onChange={keys => {
        const checked = new Set(keys);
        CHART_TYPES.forEach(({ key }) => onToggle(key, checked.has(key)));
      }}
      options={CHART_TYPES.map(({ key, label }) => ({ label, value: key }))}
    />
  );
};

export default ChartTypeSelector;
