'use client';

import { MenuFoldOutlined, MenuUnfoldOutlined, ProductOutlined } from '@ant-design/icons';
import { Button, Layout, Menu } from 'antd';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideMenuLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const items = [
    {
      key: 'module-a',
      label: 'ModuleA',
      icon: <ProductOutlined />,
      children: [
        {
          key: 'module-a-demo1',
          label: <Link href="/module-a/demo1">Demo1</Link>,
          href: '/module-a/demo1',
        },
        {
          key: 'module-a-demo2',
          label: <Link href="/module-a/demo2">Demo2</Link>,
          href: '/module-a/demo2',
        },
      ],
    },
    {
      key: 'module-b',
      label: 'ModuleB',
      icon: <ProductOutlined />,
      children: [
        {
          key: 'module-b-demo1',
          label: <Link href="/module-b/demo1">Demo1</Link>,
          href: '/module-b/demo1',
        },
        {
          key: 'module-b-demo2',
          label: <Link href="/module-b/demo2">Demo2</Link>,
          href: '/module-b/demo2',
        },
      ],
    },
  ];

  const getDefaultOpenKeys = () => {
    if (pathname && pathname.startsWith('/module-a')) return ['module-a'];
    if (pathname && pathname.startsWith('/module-b')) return ['module-b'];
    return [];
  };

  const getSelectedKey = () => {
    if (pathname === '/module-a/demo1') return 'module-a-demo1';
    if (pathname === '/module-a/demo2') return 'module-a-demo2';
    if (pathname === '/module-b/demo1') return 'module-b-demo1';
    if (pathname === '/module-b/demo2') return 'module-b-demo2';

    return '';
  };

  return (
    <>
      <Layout.Sider theme="light" trigger={null} collapsible collapsed={collapsed} width={250}>
        <div className="demo-logo-vertical" />
        <Button
          style={{ marginLeft: '20px', marginTop: '10px', color: '#000000' }}
          type="text"
          size="medium"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        />
        <Menu
          theme="light"
          mode="inline"
          items={items}
          defaultOpenKeys={getDefaultOpenKeys()}
          selectedKeys={[getSelectedKey()]}
        />
      </Layout.Sider>
    </>
  );
}
