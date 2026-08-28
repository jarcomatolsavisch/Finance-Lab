'use client';

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Layout, Menu } from 'antd';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import navConfig from '@/lib/config/navConfig';

export default function SideMenuLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const items = navConfig.map(section => ({
    key: section.key,
    label: section.label,
    icon: section.icon ? <section.icon /> : undefined,
    children: section.children.map(child => ({
      key: `${section.key}-${child.key}`,
      label: <Link href={child.path}>{child.label}</Link>,
      href: child.path,
    })),
  }));

  const getDefaultOpenKeys = () => {
    const section = navConfig.find(s => pathname && pathname.startsWith(`/${s.key}`));
    return section ? [section.key] : [];
  };

  const getSelectedKey = () => {
    for (const section of navConfig) {
      const child = section.children.find(c => c.path === pathname);
      if (child) return `${section.key}-${child.key}`;
    }
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
