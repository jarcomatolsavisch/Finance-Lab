'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, HistogramSeries, LineSeries } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { useChartSync } from './ChartSyncContext';
import { DOWN_COLOR, LINE_COLORS, UP_COLOR, isOutOfBounds, legendSwatch, positionTooltip } from './chartUtils';

const HEIGHT = 250;
const PANE_ID = 'volume';

const fmtVolume = n => (n == null ? '-' : Math.round(n).toLocaleString());

const toVolumePoints = data =>
  data
    .filter(row => row.TRADING_VOLUME != null)
    .map(row => ({
      time: row.DATE,
      value: row.TRADING_VOLUME,
      color: row.CLOSE >= row.OPEN ? UP_COLOR : DOWN_COLOR,
    }));

const toLinePoints = (data, key) =>
  data.filter(row => row[key] != null).map(row => ({ time: row.DATE, value: row[key] }));

// Discover which VOL_<m> columns are present directly from the data, same pattern as
// PriceMAChart's findMaKeys — no need to thread `config.M` through just to know which
// moving-average lines exist.
const findVolMaKeys = data => {
  const keys = new Set();
  data.forEach(row => Object.keys(row).forEach(key => key.startsWith('VOL_') && keys.add(key)));
  return [...keys].sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
};

// Volume chart: histogram colored by the day's price direction, plus 0-3 VOL_<m>
// moving-average overlay lines when configured. Crosshair and zoom/pan are synced with
// every other pane on the page via ChartSyncContext (see PriceMAChart for the pattern).
const VolumeChart = ({ data }) => {
  const sync = useChartSync();
  const dataRef = useRef(data);
  dataRef.current = data;
  const lockRef = useRef(sync?.lock);
  lockRef.current = sync?.lock;

  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const tooltipRef = useRef(null);

  const chartRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const maSeriesRef = useRef([]); // [{ key, color, series }]

  const updateLegend = () => {
    const legend = legendRef.current;
    if (!legend) return;

    legend.innerHTML = maSeriesRef.current.map(({ key, color }) => `<div>${legendSwatch(color)}${key}</div>`).join('');
  };

  const showTooltip = (row, point) => {
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!tooltip || !container) return;

    if (!row || !point || row.TRADING_VOLUME == null) {
      tooltip.style.display = 'none';
      return;
    }

    const maRows = maSeriesRef.current
      .map(({ key, color }) => `<div>${legendSwatch(color)}${key}：${fmtVolume(row[key])}</div>`)
      .join('');

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${row.DATE}</div>
      <div>成交量 Volume：${fmtVolume(row.TRADING_VOLUME)}</div>
      ${maRows}
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
    const volumeSeries = volumeSeriesRef.current;
    if (!chart || !volumeSeries) return;

    const row = time == null ? null : dataRef.current.find(r => r.DATE === time);
    const x = row ? chart.timeScale().timeToCoordinate(time) : null;

    if (!row || x == null || row.TRADING_VOLUME == null) {
      showTooltip(null);
      chart.clearCrosshairPosition();
      return;
    }

    chart.setCrosshairPosition(row.TRADING_VOLUME, time, volumeSeries);
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
    volumeSeriesRef.current = chart.addSeries(HistogramSeries, { color: UP_COLOR, base: 0 });

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
      volumeSeriesRef.current = null;
      maSeriesRef.current = [];
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
    const volumeSeries = volumeSeriesRef.current;
    if (!chart || !volumeSeries) return;

    volumeSeries.setData(toVolumePoints(data));

    maSeriesRef.current.forEach(({ series }) => chart.removeSeries(series));
    maSeriesRef.current = findVolMaKeys(data).map((key, i) => {
      const color = LINE_COLORS[i % LINE_COLORS.length];
      const series = chart.addSeries(LineSeries, { color, lineWidth: 2 });
      series.setData(toLinePoints(data, key));
      return { key, color, series };
    });

    chart.timeScale().fitContent();
    updateLegend();
  }, [data]);

  return (
    <Card title="Volume" className="mb-4">
      <ChartFrame containerRef={containerRef} legendRef={legendRef} tooltipRef={tooltipRef} height={HEIGHT} />
    </Card>
  );
};

export default VolumeChart;
