'use client';

import { Typography } from 'antd';

// Volume has no parameters — visibility alone is controlled by the chart selector.
// See platform/docs/TechAnalysisSpec.md 7.2.
const VolumePanel = () => <Typography.Text type="secondary">此圖表無可調整參數</Typography.Text>;

export default VolumePanel;
