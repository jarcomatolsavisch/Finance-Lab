import { ProductOutlined } from '@ant-design/icons';
import type { ComponentType } from 'react';

export type NavChild = {
  key: string;
  label: string;
  path: string;
};

export type NavSection = {
  key: string;
  label: string;
  icon?: ComponentType;
  children: NavChild[];
};

// Single source of truth for site navigation.
// SideMenuLayout renders this as the sidebar menu; breadCrumbConfig derives from it.
const navConfig: NavSection[] = [
  {
    key: 'tw-stock',
    label: '台股分析',
    icon: ProductOutlined,
    children: [
      { key: 'trend', label: '股價走勢查詢', path: '/tw-stock/trend' },
      { key: 'portfolio', label: '投資組合分析', path: '/tw-stock/portfolio' },
    ],
  },
];

export default navConfig;
