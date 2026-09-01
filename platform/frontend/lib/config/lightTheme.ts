import type { ThemeConfig } from 'antd';

const GREEN_1 = '#00674F'; // 主色（翡翠綠）
const GREEN_2 = '#004D3B'; // 次色（hover，較深綠）
const GREEN_3 = '#CDE8E0'; // 輔助色（較淺綠）
const GRAY_HOVER = '#F0F0F0'; // 側邊選單 hover 背景（淡灰）
const GRAY_SELECTED = '#DCDCDC'; // 側邊選單選中背景（淡灰）
const SUCCESS_COLOR = '#52c41a';
const ERROR_COLOR = '#B42D18';
const WHITE_1 = '#ffffff';
const WHITE_2 = '#F2F3F5';
const BLACK_1 = '#333333';
const GRAY_1 = '#636569'; // 一般文字、標題顏色
const GRAY_3 = '#fafafa'; // 列表卡片背景

const FONT_SIZE = {
  SMAILL: 12,
  MEDIUM: 16,
  LARGE: 20,
};

export const lightTheme: ThemeConfig = {
  token: {
    // ========== 字體大小相關 ==========
    fontFamily: 'var(--font-asus)',
    fontSizeSM: FONT_SIZE.SMAILL,
    fontSize: FONT_SIZE.MEDIUM,
    fontSizeLG: FONT_SIZE.LARGE,
    fontSizeHeading1: 24,
    fontSizeHeading2: FONT_SIZE.LARGE,
    fontSizeHeading3: 18,
    fontSizeHeading4: FONT_SIZE.MEDIUM,
    fontSizeHeading5: FONT_SIZE.SMAILL,

    // ========== 顏色相關 ==========
    colorPrimary: GREEN_1, // 主色
    colorSuccess: SUCCESS_COLOR, // 成功（綠）
    colorWarning: '#B42D18', // 警告（橙）
    colorError: ERROR_COLOR, // 錯誤（紅）
    colorInfo: GREEN_1, // 資訊（通常跟主色一致）
  },
  components: {
    Typography: {
      colorText: GRAY_1, // 一般文字顏色
      colorTextHeading: GREEN_1, // 標題文字顏色
      colorLink: GRAY_1, // link 顏色
      colorLinkHover: GREEN_1, // link hover 顏色
      titleMarginBottom: 0,
      titleMarginTop: 0,
    },
    Card: {
      colorBgContainer: GRAY_3, // 卡片背景顏色
      colorText: GRAY_1, // 卡片文字顏色
      borderRadius: 4,
      paddingXXS: 10,
      paddingXS: 10,
      paddingSM: 10,
      paddingMD: 10,
      paddingLG: 10,
    },
    Menu: {
      itemBg: WHITE_2, // 選單背景
      itemColor: BLACK_1, // 項目顏色
      itemHoverColor: BLACK_1, // hover 時項目顏色
      itemHoverBg: GRAY_HOVER, // hover 時背景顏色（淡灰）
      itemSelectedColor: BLACK_1, // 選中項目文字顏色
      itemSelectedBg: GRAY_SELECTED, // 選中項目背景顏色（淡灰）
    },
    Layout: {
      headerBg: GREEN_1, // 標頭背景顏色
      headerColor: WHITE_1, // 標頭文字顏色
      colorBgContainer: WHITE_2, // 容器背景顏色
    },
    Button: {
      colorPrimary: GREEN_1, // 主色
      colorText: GRAY_1, // 文字顏色
      colorBgTextHover: WHITE_1, // hover 時文字顏色
      borderRadius: 4,
      primaryShadow: 'none',
      colorTextDisabled: GREEN_1, // 禁用狀態文字顏色
      colorPrimaryHover: GREEN_2, // hover 時的主色（較深綠）
    },
    Tabs: {
      horizontalMargin: '0',
      colorBgContainer: GREEN_3, // 較淺綠
      cardBg: GRAY_3,
      padding: 0,
    },
    Breadcrumb: {
      itemColor: GREEN_1,
    },
  },
};
