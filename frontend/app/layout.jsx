'use client';

import { asusFont } from '@/lib/config/fonts';
import { lightTheme } from '@/lib/config/lightTheme';
import SideMenuLayout from '@/components/layout/SideMenuLayout';
import HeaderLayout from '@/components/layout/HeaderLayout';
import { Layout, ConfigProvider } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import Content from 'antd/es/layout/layout';
import { Suspense } from 'react';
import Loading from './loading';
import './globals.css';
import BreadCrumb from '@/components/common/BreadCrumb';
import zhCN from 'antd/lib/locale/zh_CN';
import moment from 'moment';
import 'moment/dist/locale/zh-cn';

moment.locale('zh-cn');

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={asusFont.variable}>
      <body>
        <AntdRegistry>
          <ConfigProvider theme={lightTheme} locale={zhCN}>
            <Layout>
              {/* Header */}
              <HeaderLayout />
              <Layout hasSider className="mt-16">
                {/* SideMenu */}
                <SideMenuLayout
                  style={{
                    position: 'fixed',
                    height: '100vh',
                    left: 0,
                    top: 64,
                    boxShadow: '4px 0 8px rgba(0, 0, 0, 0.1)',
                  }}
                />
                {/* Content */}
                <Layout style={{ transition: 'margin-left 0.2s' }}>
                  <Content
                    className="flex overflow-y-auto overflow-x-hidden relative p-5 w-full"
                    style={{
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      height: 'calc(100vh - 64px)',
                    }}
                  >
                    <BreadCrumb />
                    <Suspense fallback={<Loading />}>
                      <div className="h-full">{children}</div>
                    </Suspense>
                  </Content>
                </Layout>
              </Layout>
            </Layout>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
