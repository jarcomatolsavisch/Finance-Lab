'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, LineSeries, LineStyle } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { useChartSync } from './ChartSyncContext';
import { LINE_COLORS, fmt, isOutOfBounds, legendSwatch, positionTooltip } from './chartUtils';

const HEIGHT = 250;
const PANE_ID = 'rsi';
const REF_LINE_COLOR = '#9e9e9e';
const FULL_RANGE_AUTOSCALE = () => ({ priceRange: { minValue: 0, maxValue: 100 } });

const toLinePoints = (data, key) =>
  data.filter(row => row[key] != null).map(row => ({ time: row.DATE, value: row[key] }));

// Discover which RSI_<m> columns are present directly from the data, same pattern as
// PriceMAChart's findMaKeys.
const findRsiKeys = data => {
  const keys = new Set();
  data.forEach(row => Object.keys(row).forEach(key => key.startsWith('RSI_') && keys.add(key)));
  return [...keys].sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
};

// RSI chart: independent Pane with 1-3 RSI_<m> lines plus fixed 70/30 overbought/oversold
// reference lines, built with lightweight-charts. Crosshair and zoom/pan are synced with
// every other pane on the page via ChartSyncContext (see PriceMAChart for the pattern).
const RSIChart = ({ data }) => {
  const sync = useChartSync();
  const dataRef = useRef(data);
  dataRef.current = data;
  const lockRef = useRef(sync?.lock);
  lockRef.current = sync?.lock;

  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const tooltipRef = useRef(null);

  const chartRef = useRef(null);
  const rsiSeriesRef = useRef([]); // [{ key, color, series }]

  const updateLegend = () => {
    const legend = legendRef.current;
    if (!legend) return;

    legend.innerHTML = rsiSeriesRef.current.map(({ key, color }) => `<div>${legendSwatch(color)}${key}</div>`).join('');
  };

  const showTooltip = (row, point) => {
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!tooltip || !container) return;

    if (!row || !point || rsiSeriesRef.current.length === 0) {
      tooltip.style.display = 'none';
      return;
    }

    const rows = rsiSeriesRef.current.map(({ key, color }) => `<div>${legendSwatch(color)}${key}：${fmt(row[key])}</div>`).join('');

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${row.DATE}</div>
      ${rows}
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
    const first = rsiSeriesRef.current[0];
    if (!chart || !first) return;

    const row = time == null ? null : dataRef.current.find(r => r.DATE === time);
    const x = row ? chart.timeScale().timeToCoordinate(time) : null;
    const price = row ? row[first.key] : null;

    if (!row || x == null || price == null) {
      showTooltip(null);
      chart.clearCrosshairPosition();
      return;
    }

    chart.setCrosshairPosition(price, time, first.series);
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
      rsiSeriesRef.current = [];
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
    if (!chart) return;

    rsiSeriesRef.current.forEach(({ series }) => chart.removeSeries(series));
    rsiSeriesRef.current = findRsiKeys(data).map((key, i) => {
      const color = LINE_COLORS[i % LINE_COLORS.length];
      const series = chart.addSeries(LineSeries, { color, lineWidth: 2, autoscaleInfoProvider: FULL_RANGE_AUTOSCALE });
      series.setData(toLinePoints(data, key));
      if (i === 0) {
        series.createPriceLine({ price: 70, color: REF_LINE_COLOR, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '70' });
        series.createPriceLine({ price: 30, color: REF_LINE_COLOR, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '30' });
      }
      return { key, color, series };
    });

    chart.timeScale().fitContent();
    updateLegend();
  }, [data]);

  return (
    <Card title="RSI" className="mb-4">
      <ChartFrame containerRef={containerRef} legendRef={legendRef} tooltipRef={tooltipRef} height={HEIGHT} />
    </Card>
  );
};

export default RSIChart;
