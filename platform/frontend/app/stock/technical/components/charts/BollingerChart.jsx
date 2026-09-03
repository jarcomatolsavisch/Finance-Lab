'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, CandlestickSeries, LineSeries, LineStyle } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { DOWN_COLOR, LINE_COLORS, UP_COLOR, fmt, isOutOfBounds, legendSwatch, positionTooltip } from './chartUtils';

const HEIGHT = 450;
const MID_COLOR = '#9e9e9e';

const toCandlePoints = data =>
  data
    .filter(row => row.OPEN != null && row.MAX != null && row.MIN != null && row.CLOSE != null)
    .map(row => ({ time: row.DATE, open: row.OPEN, high: row.MAX, low: row.MIN, close: row.CLOSE }));

const toLinePoints = (data, key) =>
  data.filter(row => row[key] != null).map(row => ({ time: row.DATE, value: row[key] }));

// Discover which std multipliers are present from the BOLL_UPPER_<std> keys in the data —
// no need to thread `config.std` through just to know which band pairs exist.
const findStdSuffixes = data => {
  const suffixes = new Set();
  data.forEach(row =>
    Object.keys(row).forEach(key => {
      const match = key.match(/^BOLL_UPPER_(.+)$/);
      if (match) suffixes.add(match[1]);
    })
  );
  return [...suffixes].sort((a, b) => Number(a.replace('p', '.')) - Number(b.replace('p', '.')));
};

// Bollinger Bands chart: candlestick + mid band + one upper/lower pair per std multiplier,
// built with lightweight-charts. `config` isn't used yet — candlestick-only for now, same
// as PriceMAChart.
const BollingerChart = ({ data }) => {
  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const tooltipRef = useRef(null);

  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const midSeriesRef = useRef(null);
  const bandSeriesRef = useRef([]); // [{ suffix, color, upper, lower }]

  const updateLegend = () => {
    const legend = legendRef.current;
    if (!legend) return;

    const rows = [`<div>${legendSwatch(MID_COLOR)}BOLL_MID</div>`];
    bandSeriesRef.current.forEach(({ suffix, color }) => {
      rows.push(`<div>${legendSwatch(color)}BOLL ±${suffix.replace('p', '.')}</div>`);
    });
    legend.innerHTML = rows.join('');
  };

  const updateTooltip = param => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!container || !tooltip || !candleSeries) return;

    const candle = param?.time ? param.seriesData.get(candleSeries) : null;
    if (!candle || isOutOfBounds(param, container)) {
      tooltip.style.display = 'none';
      return;
    }

    const mid = param.seriesData.get(midSeriesRef.current);
    const bandRows = bandSeriesRef.current
      .map(({ suffix, color, upper, lower }) => {
        const upperPoint = param.seriesData.get(upper);
        const lowerPoint = param.seriesData.get(lower);
        return `<div>${legendSwatch(color)}±${suffix.replace('p', '.')}：${fmt(upperPoint?.value)} / ${fmt(lowerPoint?.value)}</div>`;
      })
      .join('');

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${param.time}</div>
      <div>開盤 Open：${fmt(candle.open)}</div>
      <div>收盤 Close：${fmt(candle.close)}</div>
      <div>最高 MAX：${fmt(candle.high)}</div>
      <div>最低 MIN：${fmt(candle.low)}</div>
      <div>${legendSwatch(MID_COLOR)}BOLL_MID：${fmt(mid?.value)}</div>
      ${bandRows}
    `;
    positionTooltip(tooltip, container, param.point);
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
    midSeriesRef.current = chart.addSeries(LineSeries, { color: MID_COLOR, lineWidth: 1, lineStyle: LineStyle.Dashed });

    chart.subscribeCrosshairMove(updateTooltip);

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      midSeriesRef.current = null;
      bandSeriesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    candleSeries.setData(toCandlePoints(data));
    midSeriesRef.current.setData(toLinePoints(data, 'BOLL_MID'));

    bandSeriesRef.current.forEach(({ upper, lower }) => {
      chart.removeSeries(upper);
      chart.removeSeries(lower);
    });
    bandSeriesRef.current = findStdSuffixes(data).map((suffix, i) => {
      const color = LINE_COLORS[i % LINE_COLORS.length];
      const upper = chart.addSeries(LineSeries, { color, lineWidth: 1 });
      const lower = chart.addSeries(LineSeries, { color, lineWidth: 1 });
      upper.setData(toLinePoints(data, `BOLL_UPPER_${suffix}`));
      lower.setData(toLinePoints(data, `BOLL_LOWER_${suffix}`));
      return { suffix, color, upper, lower };
    });

    chart.timeScale().fitContent();
    updateLegend();
  }, [data]);

  return (
    <Card title="Bollinger Bands" className="mb-4">
      <ChartFrame containerRef={containerRef} legendRef={legendRef} tooltipRef={tooltipRef} height={HEIGHT} />
    </Card>
  );
};

export default BollingerChart;
