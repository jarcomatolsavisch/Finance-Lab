'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { useChartSync } from './ChartSyncContext';
import { DOWN_COLOR, LINE_COLORS, UP_COLOR, fmt, isOutOfBounds, legendSwatch, positionTooltip } from './chartUtils';

const HEIGHT = 450;
const PANE_ID = 'priceMA';

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

// Price/MA chart: candlestick + MA overlay lines, built with lightweight-charts (TradingView).
// `config` isn't used yet — this is candlestick-only, no price-appearance switch yet.
//
// Crosshair and zoom/pan are synced with every other pane on the page via ChartSyncContext:
// this pane broadcasts its own real mouse/zoom events, and applies whatever other panes
// broadcast by looking up the same row from `data` (identical across all panes) rather than
// depending on this chart's own lightweight-charts seriesData.
const PriceMAChart = ({ data }) => {
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
  const maSeriesRef = useRef([]); // [{ key, color, series }]

  // Static — just which MA lines exist and their colors, not their values. Refreshed
  // whenever the MA lines themselves change (see the data effect below), not on hover.
  const updateLegend = () => {
    const legend = legendRef.current;
    if (!legend) return;

    legend.innerHTML = maSeriesRef.current.map(({ key, color }) => `<div>${legendSwatch(color)}${key}</div>`).join('');
  };

  // Renders (or hides) the tooltip from a data row — shared by this pane's own mouse move
  // and by a crosshair broadcast synced in from another pane.
  const showTooltip = (row, point) => {
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!tooltip || !container) return;

    if (!row || !point || row.OPEN == null || row.MAX == null || row.MIN == null || row.CLOSE == null) {
      tooltip.style.display = 'none';
      return;
    }

    const maRows = maSeriesRef.current
      .map(({ key, color }) => `<div>${legendSwatch(color)}${key}：${fmt(row[key])}</div>`)
      .join('');

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${row.DATE}</div>
      <div>開盤 Open：${fmt(row.OPEN)}</div>
      <div>收盤 Close：${fmt(row.CLOSE)}</div>
      <div>最高 MAX：${fmt(row.MAX)}</div>
      <div>最低 MIN：${fmt(row.MIN)}</div>
      ${maRows}
    `;
    positionTooltip(tooltip, container, point);
  };

  const updateTooltip = param => {
    const container = containerRef.current;
    if (!container) return;

    // Lock Mode: ignore hover entirely and re-assert the pinned position/tooltip, overriding
    // whatever lightweight-charts' own native mouse-driven crosshair just did — this runs
    // synchronously before the next repaint, so the pinned crosshair never visibly "loses" to
    // the mouse. See ChartSyncContext for the toggle.
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

  // Applies a crosshair position broadcast by another pane: moves this chart's own native
  // crosshair line so all panes line up visually, and shows this pane's own tooltip content
  // for that date (looked up from the shared `data`, not this chart's own seriesData).
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

  // Applies a zoom/pan range broadcast by another pane. No-ops when already at that range —
  // this is what actually breaks the sync feedback loop, since setVisibleLogicalRange's own
  // change event fires on the next animation frame rather than synchronously.
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

    chart.subscribeCrosshairMove(updateTooltip);
    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (range) sync?.broadcastRange(PANE_ID, range);
    });
    // Lock Mode toggle: click any pane to pin every pane to that date, click again to
    // release. Entering lock requires a valid date; releasing always succeeds (see
    // ChartSyncContext.toggleLock).
    chart.subscribeClick(param => sync?.toggleLock(param?.time ?? null));
    sync?.registerPane(PANE_ID, { applyCrosshair, applyRange });

    return () => {
      sync?.unregisterPane(PANE_ID);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      maSeriesRef.current = [];
    };
  }, []);

  // Reacts to Lock Mode toggling: pins this pane to the locked date (and disables its own
  // zoom/pan so mouse-wheel scrolling falls through to the page instead) or restores normal
  // hover/zoom interaction.
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

    maSeriesRef.current.forEach(({ series }) => chart.removeSeries(series));
    maSeriesRef.current = findMaKeys(data).map((key, i) => {
      const color = LINE_COLORS[i % LINE_COLORS.length];
      const series = chart.addSeries(LineSeries, { color, lineWidth: 2 });
      series.setData(toLinePoints(data, key));
      return { key, color, series };
    });

    chart.timeScale().fitContent();
    updateLegend();
  }, [data]);

  return (
    <Card title="Price/MA" className="mb-4">
      <ChartFrame containerRef={containerRef} legendRef={legendRef} tooltipRef={tooltipRef} height={HEIGHT} />
    </Card>
  );
};

export default PriceMAChart;
