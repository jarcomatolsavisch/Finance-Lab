'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';

const HEIGHT = 360;
const MA_LINE_COLORS = ['#f5a623', '#2962ff', '#9c27b0'];
const UP_COLOR = '#26a69a';
const DOWN_COLOR = '#ef5350';

const toCandlePoints = data =>
  data
    .filter(row => row.OPEN != null && row.MAX != null && row.MIN != null && row.CLOSE != null)
    .map(row => ({ time: row.DATE, open: row.OPEN, high: row.MAX, low: row.MIN, close: row.CLOSE }));

// Discover which MA_<m> columns are present directly from the data, sorted by period —
// no need to thread `config.M` through just to know which lines exist (see lib/chartData.js).
const findMaKeys = data => {
  const keys = new Set();
  data.forEach(row => Object.keys(row).forEach(key => key.startsWith('MA_') && keys.add(key)));
  return [...keys].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
};

const toLinePoints = (data, key) =>
  data.filter(row => row[key] != null).map(row => ({ time: row.DATE, value: row[key] }));

const fmt = n => (n == null ? '-' : n.toFixed(2));

// Price/MA chart: candlestick + MA overlay lines, built with lightweight-charts (TradingView).
// `config` isn't used yet — this is candlestick-only, no price-appearance switch yet.
const PriceMAChart = ({ data }) => {
  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const tooltipRef = useRef(null);

  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const maSeriesRef = useRef([]); // [{ key, color, series }]
  const dataRef = useRef(data);

  // Reads whatever the crosshair is over, falling back to the latest row when `param` is
  // absent (e.g. right after data loads, before the user has hovered anything).
  const updateLegend = param => {
    const legend = legendRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!legend || !candleSeries) return;

    const lastRow = dataRef.current[dataRef.current.length - 1];
    const candle = param?.time ? param.seriesData.get(candleSeries) : null;
    const open = candle ? candle.open : lastRow?.OPEN;
    const close = candle ? candle.close : lastRow?.CLOSE;

    const rows = [
      `<span style="color:${close >= open ? UP_COLOR : DOWN_COLOR}">■</span> Price O ${fmt(open)} C ${fmt(close)}`,
      ...maSeriesRef.current.map(({ key, color, series }) => {
        const point = param?.time ? param.seriesData.get(series) : null;
        const value = point ? point.value : lastRow?.[key];
        return `<span style="color:${color}">■</span> ${key} ${fmt(value)}`;
      }),
    ];
    legend.innerHTML = rows.join('&nbsp;&nbsp;&nbsp;');
  };

  const updateTooltip = param => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!container || !tooltip || !candleSeries) return;

    const candle = param?.time ? param.seriesData.get(candleSeries) : null;
    const outOfBounds =
      !param?.point ||
      param.point.x < 0 ||
      param.point.x > container.clientWidth ||
      param.point.y < 0 ||
      param.point.y > container.clientHeight;

    if (!candle || outOfBounds) {
      tooltip.style.display = 'none';
      return;
    }

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${param.time}</div>
      <div>開盤 Open：${fmt(candle.open)}</div>
      <div>收盤 Close：${fmt(candle.close)}</div>
      <div>最高 MAX：${fmt(candle.high)}</div>
      <div>最低 MIN：${fmt(candle.low)}</div>
    `;

    const left = Math.min(Math.max(param.point.x + 16, 0), container.clientWidth - 150);
    const top = Math.min(Math.max(param.point.y + 16, 0), container.clientHeight - 100);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  useEffect(() => {
    const chart = createChart(containerRef.current, { height: HEIGHT, autoSize: true });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderVisible: false,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });

    chart.subscribeCrosshairMove(param => {
      updateLegend(param);
      updateTooltip(param);
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      maSeriesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    dataRef.current = data;
    candleSeries.setData(toCandlePoints(data));

    maSeriesRef.current.forEach(({ series }) => chart.removeSeries(series));
    maSeriesRef.current = findMaKeys(data).map((key, i) => {
      const color = MA_LINE_COLORS[i % MA_LINE_COLORS.length];
      const series = chart.addSeries(LineSeries, { color, lineWidth: 2 });
      series.setData(toLinePoints(data, key));
      return { key, color, series };
    });

    chart.timeScale().fitContent();
    updateLegend();
  }, [data]);

  return (
    <Card title="Price/MA" className="mb-4">
      <div style={{ position: 'relative' }}>
        <div
          ref={legendRef}
          style={{
            position: 'absolute',
            left: 12,
            top: 8,
            zIndex: 1,
            fontSize: 12,
            lineHeight: '18px',
            background: 'rgba(255,255,255,0.85)',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        />
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            display: 'none',
            zIndex: 2,
            padding: 8,
            fontSize: 12,
            lineHeight: '16px',
            background: 'white',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        />
        <div ref={containerRef} style={{ width: '100%', height: HEIGHT }} />
      </div>
    </Card>
  );
};

export default PriceMAChart;
