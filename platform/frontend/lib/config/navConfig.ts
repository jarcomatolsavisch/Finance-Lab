import { FundOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
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
// Structure mirrors platform/docs/FunctionSpec.md (個股分析 / 比較分析 / 投資組合分析).
const navConfig: NavSection[] = [
  {
    key: 'stock',
    label: '個股分析',
    icon: LineChartOutlined,
    children: [
      { key: 'trend', label: '股價走勢', path: '/stock/trend' },
      { key: 'valuation', label: '估值比較', path: '/stock/valuation' },
      { key: 'fundamental', label: '基本面分析', path: '/stock/fundamental' },
      { key: 'technical', label: '技術面分析', path: '/stock/technical' }
    ],
  },
  {
    key: 'portfolio',
    label: '投資組合分析',
    icon: PieChartOutlined,
    children: [
      { key: 'efficient-frontier', label: '效率前緣分析', path: '/portfolio/efficient-frontier' },
    ],
  },
];

export default navConfig;
