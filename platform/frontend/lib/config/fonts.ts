import localFont from 'next/font/local';

// 載入字型
export const asusFont = localFont({
  src: [
    {
      path: '../../public/fonts/TT_Norms_Pro_Normal.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/TT_Norms_Pro_Bold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-asus',
  display: 'swap',
  preload: true,
});
