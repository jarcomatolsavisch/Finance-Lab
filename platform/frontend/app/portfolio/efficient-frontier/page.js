'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Flex, Row, Select, DatePicker, Spin, Empty, Typography } from 'antd';
import { Scatter } from '@ant-design/plots';
import { Controller, useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { getEfficientFrontier, searchTwStocks } from '@/actions/actions';
import ResponsiveCol from '@/components/common/ResponsiveCol';

const { RangePicker } = DatePicker;

const DEFAULT_RANGE = [dayjs().subtract(12, 'month'), dayjs()];
const SEARCH_DEBOUNCE_MS = 300;

const ROLE_LABELS = {
  portfolio: '模擬組合',
  max_sharpe: '最大 Sharpe 組合',
  min_volatility: '最小波動組合',
};

export default function Page() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { stocks: [], range: DEFAULT_RANGE } });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [frontierResult, setFrontierResult] = useState(null);

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

    const res = await getEfficientFrontier(
      stocks,
      range[0].format('YYYY-MM-DD'),
      range[1].format('YYYY-MM-DD')
    );

    if (res?.error) {
      setError(res.error);
      setFrontierResult(null);
    } else {
      setFrontierResult(res);
    }
    setLoading(false);
  };

  const displayData = useMemo(() => {
    if (!frontierResult) return [];
    const simulated = frontierResult.portfolios.map(p => ({ ...p, role: 'portfolio' }));
    return [
      ...simulated,
      { ...frontierResult.max_sharpe, role: 'max_sharpe' },
      { ...frontierResult.min_volatility, role: 'min_volatility' },
    ];
  }, [frontierResult]);

  const tooltipItems = useMemo(() => {
    if (!frontierResult) return [];
    const base = [
      d => ({ name: '年化報酬', value: `${(d.annual_return * 100).toFixed(2)}%` }),
      d => ({ name: '年化波動', value: `${(d.annual_volatility * 100).toFixed(2)}%` }),
      d => ({ name: 'Sharpe Ratio', value: d.sharpe_ratio.toFixed(4) }),
    ];
    const weightItems = frontierResult.ids.map(id => d => ({
      name: stockNames[id] || id,
      value: `${(d.weights[id] * 100).toFixed(1)}%`,
    }));
    return [...base, ...weightItems];
  }, [frontierResult, stockNames]);

  return (
    <div className="w-full h-full flex flex-col">
      <Card title="效率前緣分析" className="mb-4">
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
                  rules={{ validate: value => (value && value.length >= 2) || '請選擇至少 2 檔股票' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      mode="multiple"
                      showSearch
                      filterOption={false}
                      onSearch={handleSearch}
                      options={options}
                      loading={searching}
                      placeholder="輸入股票代號或名稱搜尋（至少選擇 2 檔）"
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
                  計算效率前緣
                </Button>
              </ResponsiveCol>
            </Row>
          </Flex>
        </form>
      </Card>

      {error && <Alert type="error" message={error} showIcon className="mb-4" />}

      <Card
        className="flex-1 mb-[50px]"
        styles={{ body: { height: '100%', overflow: 'auto' } }}
      >
        <Spin spinning={loading}>
          {displayData.length > 0 ? (
            <Scatter
              data={displayData}
              xField="annual_volatility"
              yField="annual_return"
              colorField="sharpe_ratio"
              shapeField="role"
              sizeField="role"
              scale={{
                shape: {
                  domain: ['portfolio', 'max_sharpe', 'min_volatility'],
                  range: ['point', 'diamond', 'diamond'],
                },
                size: {
                  domain: ['portfolio', 'max_sharpe', 'min_volatility'],
                  range: [4, 16, 16],
                },
              }}
              style={{
                stroke: d => (d.role === 'portfolio' ? undefined : '#000'),
                lineWidth: d => (d.role === 'portfolio' ? 0 : 2),
                fillOpacity: d => (d.role === 'portfolio' ? 0.45 : 1),
              }}
              height={520}
              axis={{
                x: { title: '年化波動率 (Volatility)', labelFormatter: v => `${(v * 100).toFixed(0)}%` },
                y: { title: '年化報酬率 (Return)', labelFormatter: v => `${(v * 100).toFixed(0)}%` },
              }}
              legend={{ shape: false, size: false }}
              tooltip={{
                title: d => ROLE_LABELS[d.role] || ROLE_LABELS.portfolio,
                items: tooltipItems,
              }}
            />
          ) : (
            !loading && <Empty description="請選擇股票並查詢" />
          )}
        </Spin>
      </Card>
    </div>
  );
}
