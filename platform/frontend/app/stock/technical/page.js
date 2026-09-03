'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, DatePicker, Empty, Flex, Row, Select, Spin, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { getTechnicalIndicators, searchTwStocks } from '@/actions/actions';
import ResponsiveCol from '@/components/common/ResponsiveCol';
import ChartSettingsDrawer from './components/ChartSettingsDrawer';
import PriceMAChart from './components/charts/PriceMAChart';
import { cloneConfig, createDefaultConfig } from './lib/config';
import { buildIndicatorRequests } from './lib/chartData';

const { RangePicker } = DatePicker;

const DEFAULT_RANGE = [dayjs().subtract(1, 'year'), dayjs()];
const SEARCH_DEBOUNCE_MS = 300;

export default function Page() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { stock: undefined, range: DEFAULT_RANGE } });

  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  const [stockId, setStockId] = useState(null);
  const [range, setRange] = useState(DEFAULT_RANGE);

  const [appliedConfig, setAppliedConfig] = useState(createDefaultConfig);
  const [draftConfig, setDraftConfig] = useState(createDefaultConfig);
  const [chartData, setChartData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  // Single source of truth for fetching: whenever the stock, date range, or applied chart
  // config changes, request the current set of enabled indicators and replace chartData
  // with whatever comes back. No caching, no merging with prior chartData.
  useEffect(() => {
    if (!stockId) return;

    let ignore = false;
    setLoading(true);
    setError(null);

    const requests = buildIndicatorRequests(appliedConfig.charts);
    const start = range[0].format('YYYY-MM-DD');
    const end = range[1].format('YYYY-MM-DD');

    getTechnicalIndicators(stockId, start, end, requests).then(res => {
      if (ignore) return;

      if (res?.error) {
        setError(res.error);
        setChartData([]);
      } else {
        setChartData(res.data);
      }
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [stockId, range, appliedConfig]);

  const onSubmit = ({ stock, range: pickedRange }) => {
    setStockId(stock);
    setRange(pickedRange);
    setAppliedConfig(createDefaultConfig());
    setDraftConfig(createDefaultConfig());
  };

  const openDrawer = () => {
    setDraftConfig(cloneConfig(appliedConfig));
    setDrawerOpen(true);
  };

  const handleCancel = () => setDrawerOpen(false);

  const handleApply = () => {
    setAppliedConfig(draftConfig);
    setDrawerOpen(false);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Card title="個股技術面分析" className="mb-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex vertical gap={15}>
            <Row gutter={[10, 15]} align="bottom">
              <ResponsiveCol span={4}>
                <Flex horizontal gap={15}>
                  <Typography.Text>股票</Typography.Text>
                  {errors.stock && <Typography.Text type="danger">* {errors.stock.message}</Typography.Text>}
                </Flex>
                <Controller
                  control={control}
                  name="stock"
                  rules={{ required: '請選擇股票' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      showSearch
                      filterOption={false}
                      onSearch={handleSearch}
                      options={options}
                      loading={searching}
                      placeholder="輸入股票代號或名稱搜尋（僅可選擇一檔）"
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
            <Button icon={<SettingOutlined />} onClick={openDrawer}>
              技術分析設定
            </Button>
          )
        }
        className="flex-1 mb-[50px]"
        styles={{ body: { height: '100%', overflow: 'auto' } }}
      >
        {!chartData.length ? (
          <Empty description="請選擇股票並查詢" />
        ) : (
          <Spin spinning={loading}>
            {appliedConfig?.charts?.priceMA?.enabled && (
              <PriceMAChart data={chartData} config={appliedConfig.charts.priceMA} />
            )}
            {appliedConfig?.charts?.volume?.enabled && <span>Volume Chart</span>}
            {appliedConfig?.charts?.macd?.enabled && <span>MACD Chart</span>}
            {appliedConfig?.charts?.boll?.enabled && <span>Bollinger Bands Chart</span>}
          </Spin>
        )}
      </Card>

      <ChartSettingsDrawer
        open={drawerOpen}
        draftConfig={draftConfig}
        setDraftConfig={setDraftConfig}
        onCancel={handleCancel}
        onApply={handleApply}
      />
    </div>
  );
}
