'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, HistogramSeries, LineSeries } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { useChartSync } from './ChartSyncContext';
import { DOWN_COLOR, UP_COLOR, fmt, isOutOfBounds, legendSwatch, positionTooltip } from './chartUtils';

const HEIGHT = 300;
const PANE_ID = 'macd';
const DIF_COLOR = '#2962ff';
const SIGNAL_COLOR = '#f5a623';
const HISTOGRAM_NEUTRAL_COLOR = '#9e9e9e';

const toLinePoints = (data, key) =>
  data.filter(row => row[key] != null).map(row => ({ time: row.DATE, value: row[key] }));

const toHistogramPoints = data =>
  data
    .filter(row => row.MACD_HISTOGRAM != null)
    .map(row => ({ time: row.DATE, value: row.MACD_HISTOGRAM, color: row.MACD_HISTOGRAM >= 0 ? UP_COLOR : DOWN_COLOR }));

// MACD chart: DIF/Signal lines + Histogram, built with lightweight-charts. Crosshair and
// zoom/pan are synced with every other pane on the page via ChartSyncContext (see
// PriceMAChart for the pattern).
const MACDChart = ({ data }) => {
  const sync = useChartSync();
  const dataRef = useRef(data);
  dataRef.current = data;
  const lockRef = useRef(sync?.lock);
  lockRef.current = sync?.lock;

  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const tooltipRef = useRef(null);

  const chartRef = useRef(null);
  const difSeriesRef = useRef(null);
  const signalSeriesRef = useRef(null);
  const histogramSeriesRef = useRef(null);

  const showTooltip = (row, point) => {
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!tooltip || !container) return;

    if (!row || !point || row.MACD_DIF == null) {
      tooltip.style.display = 'none';
      return;
    }

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${row.DATE}</div>
      <div>${legendSwatch(DIF_COLOR)}MACD：${fmt(row.MACD_DIF)}</div>
      <div>${legendSwatch(SIGNAL_COLOR)}Signal：${fmt(row.MACD_SIGNAL)}</div>
      <div>${legendSwatch(HISTOGRAM_NEUTRAL_COLOR)}Histogram：${fmt(row.MACD_HISTOGRAM)}</div>
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
    const difSeries = difSeriesRef.current;
    if (!chart || !difSeries) return;

    const row = time == null ? null : dataRef.current.find(r => r.DATE === time);
    const x = row ? chart.timeScale().timeToCoordinate(time) : null;

    if (!row || x == null || row.MACD_DIF == null) {
      showTooltip(null);
      chart.clearCrosshairPosition();
      return;
    }

    chart.setCrosshairPosition(row.MACD_DIF, time, difSeries);
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
    histogramSeriesRef.current = chart.addSeries(HistogramSeries, { base: 0 });
    difSeriesRef.current = chart.addSeries(LineSeries, { color: DIF_COLOR, lineWidth: 2 });
    signalSeriesRef.current = chart.addSeries(LineSeries, { color: SIGNAL_COLOR, lineWidth: 2 });

    chart.subscribeCrosshairMove(updateTooltip);
    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (range) sync?.broadcastRange(PANE_ID, range);
    });
    chart.subscribeClick(param => sync?.toggleLock(param?.time ?? null));
    sync?.registerPane(PANE_ID, { applyCrosshair, applyRange });

    const legend = legendRef.current;
    if (legend) {
      legend.innerHTML = [
        `<div>${legendSwatch(DIF_COLOR)}MACD</div>`,
        `<div>${legendSwatch(SIGNAL_COLOR)}Signal</div>`,
        `<div>${legendSwatch(HISTOGRAM_NEUTRAL_COLOR)}Histogram</div>`,
      ].join('');
    }

    return () => {
      sync?.unregisterPane(PANE_ID);
      chart.remove();
      chartRef.current = null;
      difSeriesRef.current = null;
      signalSeriesRef.current = null;
      histogramSeriesRef.current = null;
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

    difSeriesRef.current.setData(toLinePoints(data, 'MACD_DIF'));
    signalSeriesRef.current.setData(toLinePoints(data, 'MACD_SIGNAL'));
    histogramSeriesRef.current.setData(toHistogramPoints(data));
    chart.timeScale().fitContent();
  }, [data]);

  return (
    <Card title="MACD" className="mb-4">
      <ChartFrame containerRef={containerRef} legendRef={legendRef} tooltipRef={tooltipRef} height={HEIGHT} />
    </Card>
  );
};

export default MACDChart;
