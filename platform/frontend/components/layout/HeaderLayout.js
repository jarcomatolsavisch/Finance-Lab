'use client';

import { Layout, Typography, Row, Col, Flex } from 'antd';
import Link from 'next/link';

const { Header } = Layout;

const HeaderLayout = () => {
  return (
    <Header
      style={{
        padding: '0 24px',
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 1000,
        height: 64,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Row justify="space-between" align="middle" style={{ height: '100%' }}>
        <Col>
          <Flex horizontal="true" align="center" style={{ height: 64 }}>
            <Link href="/">
              <Typography.Title
                level={1}
                style={{
                  margin: 0,
                  color: '#ffffff',
                  marginLeft: 20,
                }}
              >
                Stock Lab
              </Typography.Title>
            </Link>
          </Flex>
        </Col>
      </Row>
    </Header>
  );
};

export default HeaderLayout;
