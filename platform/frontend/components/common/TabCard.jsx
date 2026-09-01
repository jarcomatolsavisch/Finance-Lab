import { Tabs } from 'antd';

const TabCard = ({ items, onTabChange, activeKey }) => {
  return (
    <div
      id="result-container"
      className="card-container flex-1 "
      style={{
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 0,
      }}
    >
      <Tabs
        defaultActiveKey={items?.[0]?.key}
        activeKey={activeKey}
        className="flex-1"
        style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}
        items={items}
        onChange={onTabChange}
      />
    </div>
  );
};

export default TabCard;
