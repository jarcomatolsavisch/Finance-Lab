import { Card, Descriptions } from 'antd';

// data: { [cardLabel]: { [fieldKey]: value } }
const InfoCardList = ({ data }) => {
  if (!data) return null;

  const cardLabelToNumCol = (label) => {
    const labels = ['EDID', 'Note'];
    return labels.includes(label) ? 1 : 2;
  }

  return (
    <div className="flex flex-col gap-3 my-5">
      {Object.entries(data).map(([cardLabel, fields]) => (
        <Card key={cardLabel} title={cardLabel} size="small">
          <Descriptions
            column={cardLabelToNumCol(cardLabel)}
            size="small"
            bordered
            labelStyle={{ width: '20%' }}
            contentStyle={{ width: `${100/cardLabelToNumCol(cardLabel)-20}%` }}
          >
            {Object.entries(fields).map(([key, value]) => (
              <Descriptions.Item key={key} label={key} span={key==='ASUS PN'?2:1}>
                {value === null ? '' : String(value)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
      ))}
    </div>
  );
};

export default InfoCardList;
