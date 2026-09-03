'use client';

import { Card, Result } from 'antd';

const ComingSoon = ({ title }) => (
  <Card title={title}>
    <Result status="info" title="功能規劃中" subTitle="此功能尚未上線，敬請期待。" />
  </Card>
);

export default ComingSoon;
