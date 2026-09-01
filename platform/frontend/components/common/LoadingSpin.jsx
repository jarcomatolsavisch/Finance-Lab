import { Flex, Spin } from 'antd';

export const LoadingSpin = () => {
  return (
    <Flex gap="middle" vertical style={{ marginTop: 10 }}>
      <Spin size="large"></Spin>
    </Flex>
  );
};
