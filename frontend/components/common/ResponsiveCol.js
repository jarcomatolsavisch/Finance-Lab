import { Col } from 'antd';
const ResponsiveCol = ({ children, span, style, ...restProps }) => {
  const getSpan = () => {
    switch (span) {
      case 2:
        return { xs: 24, sm: 24, md: 24, lg: 24 };
      case 3:
        return { xs: 24, sm: 16, md: 8, lg: 8 };
      case 4:
        return { xs: 24, sm: 12, md: 6, lg: 6 };
      case 5:
        return { xs: 24, sm: 8, md: 6, lg: 6 };
      case 6:
        return { xs: 12, sm: 6, md: 3, lg: 3 };
      default:
        return { xs: 24, sm: 12, md: 8, lg: 8 };
    }
  };

  return (
    <Col {...getSpan()} style={style} {...restProps}>
      {children}
    </Col>
  );
};

export default ResponsiveCol;
