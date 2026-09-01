import { Flex, Spin } from 'antd';

export default function Loading() {
  return (
    <>
      <Flex justify="center" align="center">
        <Spin tip="Loading..." size="large" fullscreen />
      </Flex>
    </>
  );
}
