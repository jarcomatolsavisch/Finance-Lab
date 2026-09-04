'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, HistogramSeries, LineSeries } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { DOWN_COLOR, LINE_COLORS, UP_COLOR, isOutOfBounds, legendSwatch, positionTooltip } from './chartUtils';

const HEIGHT = 250;

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
// moving-average overlay lines when configured.
const VolumeChart = ({ data }) => {
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

  const updateTooltip = param => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!container || !tooltip || !volumeSeries) return;

    const point = param?.time ? param.seriesData.get(volumeSeries) : null;
    if (!point || isOutOfBounds(param, container)) {
      tooltip.style.display = 'none';
      return;
    }

    const maRows = maSeriesRef.current
      .map(({ key, color, series }) => {
        const maPoint = param.seriesData.get(series);
        return `<div>${legendSwatch(color)}${key}：${fmtVolume(maPoint?.value)}</div>`;
      })
      .join('');

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${param.time}</div>
      <div>成交量 Volume：${fmtVolume(point.value)}</div>
      ${maRows}
    `;
    positionTooltip(tooltip, container, param.point);
  };

  useEffect(() => {
    const chart = createChart(containerRef.current, { height: HEIGHT, autoSize: true });
    chartRef.current = chart;
    volumeSeriesRef.current = chart.addSeries(HistogramSeries, { color: UP_COLOR, base: 0 });

    chart.subscribeCrosshairMove(updateTooltip);

    return () => {
      chart.remove();
      chartRef.current = null;
      volumeSeriesRef.current = null;
      maSeriesRef.current = [];
    };
  }, []);

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
