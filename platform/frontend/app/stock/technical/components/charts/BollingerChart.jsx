'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, CandlestickSeries, LineSeries, LineStyle } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { useChartSync } from './ChartSyncContext';
import { DOWN_COLOR, LINE_COLORS, UP_COLOR, fmt, isOutOfBounds, legendSwatch, positionTooltip } from './chartUtils';

const HEIGHT = 450;
const PANE_ID = 'boll';
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
// as PriceMAChart. Crosshair and zoom/pan are synced with every other pane on the page via
// ChartSyncContext (see PriceMAChart for the pattern).
const BollingerChart = ({ data }) => {
  const sync = useChartSync();
  const dataRef = useRef(data);
  dataRef.current = data;
  const lockRef = useRef(sync?.lock);
  lockRef.current = sync?.lock;

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

  const showTooltip = (row, point) => {
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!tooltip || !container) return;

    if (!row || !point || row.OPEN == null || row.MAX == null || row.MIN == null || row.CLOSE == null) {
      tooltip.style.display = 'none';
      return;
    }

    const bandRows = bandSeriesRef.current
      .map(({ suffix, color }) => {
        const upper = row[`BOLL_UPPER_${suffix}`];
        const lower = row[`BOLL_LOWER_${suffix}`];
        return `<div>${legendSwatch(color)}±${suffix.replace('p', '.')}：${fmt(upper)} / ${fmt(lower)}</div>`;
      })
      .join('');

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${row.DATE}</div>
      <div>開盤 Open：${fmt(row.OPEN)}</div>
      <div>收盤 Close：${fmt(row.CLOSE)}</div>
      <div>最高 MAX：${fmt(row.MAX)}</div>
      <div>最低 MIN：${fmt(row.MIN)}</div>
      <div>${legendSwatch(MID_COLOR)}BOLL_MID：${fmt(row.BOLL_MID)}</div>
      ${bandRows}
    `;
    positionTooltip(tooltip, container, point);
  };

  const updateTooltip = param => {
    const container = containerRef.current;
    if (!container) return;

    if (lockRef.current?.locked) {
      applyCrosshair(lockRef.current.time);
      return;
    }

    if (!param?.time || isOutOfBounds(param, container)) {
      showTooltip(null);
      sync?.broadcastCrosshair(PANE_ID, null);
      return;
    }

    const row = dataRef.current.find(r => r.DATE === param.time);
    showTooltip(row, param.point);
    sync?.broadcastCrosshair(PANE_ID, param.time);
  };

  const applyCrosshair = time => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    const row = time == null ? null : dataRef.current.find(r => r.DATE === time);
    const x = row ? chart.timeScale().timeToCoordinate(time) : null;

    if (!row || x == null || row.CLOSE == null) {
      showTooltip(null);
      chart.clearCrosshairPosition();
      return;
    }

    chart.setCrosshairPosition(row.CLOSE, time, candleSeries);
    showTooltip(row, { x, y: 8 });
  };

  const applyRange = range => {
    const chart = chartRef.current;
    if (!chart || !range) return;

    const current = chart.timeScale().getVisibleLogicalRange();
    if (current && Math.abs(current.from - range.from) < 1e-6 && Math.abs(current.to - range.to) < 1e-6) return;
    chart.timeScale().setVisibleLogicalRange(range);
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
    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (range) sync?.broadcastRange(PANE_ID, range);
    });
    chart.subscribeClick(param => sync?.toggleLock(param?.time ?? null));
    sync?.registerPane(PANE_ID, { applyCrosshair, applyRange });

    return () => {
      sync?.unregisterPane(PANE_ID);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      midSeriesRef.current = null;
      bandSeriesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (sync?.lock?.locked) {
      chart.applyOptions({ handleScroll: false, handleScale: false });
      applyCrosshair(sync.lock.time);
    } else {
      chart.applyOptions({ handleScroll: true, handleScale: true });
    }
  }, [sync?.lock?.locked, sync?.lock?.time]);

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
