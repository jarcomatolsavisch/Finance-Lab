'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, HistogramSeries } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { DOWN_COLOR, UP_COLOR, isOutOfBounds, positionTooltip } from './chartUtils';

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

// Volume chart: a single histogram, colored by the day's price direction. No parameters,
// so no legend needed — just the tooltip on hover.
const VolumeChart = ({ data }) => {
  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const tooltipRef = useRef(null);

  const chartRef = useRef(null);
  const volumeSeriesRef = useRef(null);

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

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${param.time}</div>
      <div>成交量 Volume：${fmtVolume(point.value)}</div>
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
    };
  }, []);

  useEffect(() => {
    const volumeSeries = volumeSeriesRef.current;
    if (!volumeSeries) return;

    volumeSeries.setData(toVolumePoints(data));
    chartRef.current.timeScale().fitContent();
  }, [data]);

  return (
    <Card title="Volume" className="mb-4">
      <ChartFrame containerRef={containerRef} legendRef={legendRef} tooltipRef={tooltipRef} height={HEIGHT} />
    </Card>
  );
};

export default VolumeChart;
