'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Dropdown, Flex, Row, Select, DatePicker, Spin, Empty, Typography } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { Controller, useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { getTwStockPrices, searchTwStocks } from '@/actions/actions';
import ResponsiveCol from '@/components/common/ResponsiveCol';

const { RangePicker } = DatePicker;

const DEFAULT_RANGE = [dayjs().subtract(1, 'month'), dayjs()];
const SEARCH_DEBOUNCE_MS = 300;

const CHART_MODES = {
  price: { label: '收盤價走勢', yTitle: '收盤價 (TWD)' },
  return: { label: '漲幅比較', yTitle: '漲跌幅 (%)' },
};

export default function Page() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { stocks: [], range: DEFAULT_RANGE } });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState('price');

  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [stockNames, setStockNames] = useState({});
  const searchTimer = useRef(null);

  const handleSearch = text => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text?.trim()) {
      setOptions([]);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchTwStocks(text.trim());
      setSearching(false);

      if (res?.error) return;
      setOptions(res.map(s => ({ label: `${s.stock_id} ${s.stock_name}`, value: s.stock_id })));
      setStockNames(prev => {
        const next = { ...prev };
        res.forEach(s => {
          next[s.stock_id] = s.stock_name;
        });
        return next;
      });
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const onSubmit = async values => {
    const { stocks, range } = values;
    setLoading(true);
    setError(null);

    const res = await getTwStockPrices(
      stocks,
      range[0].format('YYYY-MM-DD'),
      range[1].format('YYYY-MM-DD')
    );

    if (res?.error) {
      setError(res.error);
      setChartData([]);
    } else {
      const sorted = [...(res.data || [])].sort((a, b) => a.date.localeCompare(b.date));
      setChartData(sorted);
    }
    setLoading(false);
  };

  const displayData = useMemo(() => {
    const withNames = chartData.map(d => ({
      ...d,
      stock_name: stockNames[d.stock_id] || d.stock_id,
    }));
    if (chartMode !== 'return') return withNames;

    const baseline = {};
    return withNames.map(d => {
      if (!(d.stock_id in baseline)) baseline[d.stock_id] = d.close;
      return { ...d, returnPct: ((d.close - baseline[d.stock_id]) / baseline[d.stock_id]) * 100 };
    });
  }, [chartData, chartMode, stockNames]);

  const chartMenuItems = Object.entries(CHART_MODES).map(([key, { label }]) => ({ key, label }));

  return (
    <div className="w-full h-full flex flex-col">
      <Card title="台股股價走勢查詢" className="mb-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex vertical gap={15}>
            <Row gutter={[10, 15]} align="bottom">
              <ResponsiveCol span={3}>
                <Flex Horizontal gap={15} align="center">
                  <Typography.Text>股票</Typography.Text>
                  {errors.stocks && <Typography.Text type="danger">* {errors.stocks.message}</Typography.Text>}
                </Flex>
                <Controller
                  control={control}
                  name="stocks"
                  rules={{ validate: value => (value && value.length > 0) || '請選擇至少一檔股票' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      mode="multiple"
                      showSearch
                      filterOption={false}
                      onSearch={handleSearch}
                      options={options}
                      loading={searching}
                      placeholder="輸入股票代號或名稱搜尋"
                      notFoundContent={searching ? <Spin size="small" /> : null}
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </ResponsiveCol>
              <ResponsiveCol span={5}>
                <Typography.Text>日期區間</Typography.Text>
                <Controller
                  control={control}
                  name="range"
                  rules={{ required: '請選擇日期區間' }}
                  render={({ field }) => (
                    <RangePicker
                      {...field}
                      disabledDate={current => current && current > dayjs().endOf('day')}
                      style={{ width: '100%' }}
                    />
                  )}
                />
                {errors.range && <Typography.Text type="danger">{errors.range.message}</Typography.Text>}
              </ResponsiveCol>

              <ResponsiveCol span={5}>
                <Button type="primary" htmlType="submit" loading={loading}>
                  查詢
                </Button>
              </ResponsiveCol>
            </Row>
          </Flex>
        </form>
      </Card>

      {error && <Alert type="error" message={error} showIcon className="mb-4" />}

      <Card
        extra={
          chartData.length > 0 && (
          <Dropdown
            menu={{
              items: chartMenuItems,
              selectedKeys: [chartMode],
              onClick: ({ key }) => setChartMode(key),
            }}
            trigger={['click']}
          >
            <MenuOutlined style={{ cursor: 'pointer' }} />
          </Dropdown>
          )
        }
        className="flex-1 mb-[50px]"
        styles={{ body: { height: '100%', overflow: 'auto' } }}
      >
        <Spin spinning={loading}>
          {displayData.length > 0 ? (
            <Line
              data={displayData}
              xField="date"
              yField={chartMode === 'return' ? 'returnPct' : 'close'}
              colorField="stock_name"
              height={480}
              axis={{ y: { title: CHART_MODES[chartMode].yTitle }, x: { title: '日期' } }}
              legend={{ color: { title: false } }}
              slider={{ x: {} }}
              tooltip={
                chartMode === 'return'
                  ? {
                      items: [
                        d => ({
                          name: d.stock_name,
                          value: `${d.returnPct.toFixed(4)}% (${d.close.toFixed(2)})`,
                        }),
                      ],
                    }
                  : {
                      items: [{ field: 'close', valueFormatter: v => v.toFixed(2) }],
                    }
              }
              interaction={{ tooltip: { sort: d => -parseFloat(d.value) } }}
            />
          ) : (
            !loading && <Empty description="尚無資料" />
          )}
        </Spin>
      </Card>
    </div>
  );
}
