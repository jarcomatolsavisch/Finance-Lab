'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, HistogramSeries, LineSeries } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { DOWN_COLOR, UP_COLOR, fmt, isOutOfBounds, legendSwatch, positionTooltip } from './chartUtils';

const HEIGHT = 300;
const DIF_COLOR = '#2962ff';
const SIGNAL_COLOR = '#f5a623';
const HISTOGRAM_NEUTRAL_COLOR = '#9e9e9e';

const toLinePoints = (data, key) =>
  data.filter(row => row[key] != null).map(row => ({ time: row.DATE, value: row[key] }));

const toHistogramPoints = data =>
  data
    .filter(row => row.MACD_HISTOGRAM != null)
    .map(row => ({ time: row.DATE, value: row.MACD_HISTOGRAM, color: row.MACD_HISTOGRAM >= 0 ? UP_COLOR : DOWN_COLOR }));

// MACD chart: DIF/Signal lines + Histogram, built with lightweight-charts.
const MACDChart = ({ data }) => {
  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const tooltipRef = useRef(null);

  const chartRef = useRef(null);
  const difSeriesRef = useRef(null);
  const signalSeriesRef = useRef(null);
  const histogramSeriesRef = useRef(null);

  const updateTooltip = param => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !tooltip) return;

    const dif = param?.time ? param.seriesData.get(difSeriesRef.current) : null;
    if (!dif || isOutOfBounds(param, container)) {
      tooltip.style.display = 'none';
      return;
    }

    const signal = param.seriesData.get(signalSeriesRef.current);
    const histogram = param.seriesData.get(histogramSeriesRef.current);

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${param.time}</div>
      <div>${legendSwatch(DIF_COLOR)}MACD：${fmt(dif.value)}</div>
      <div>${legendSwatch(SIGNAL_COLOR)}Signal：${fmt(signal?.value)}</div>
      <div>${legendSwatch(HISTOGRAM_NEUTRAL_COLOR)}Histogram：${fmt(histogram?.value)}</div>
    `;
    positionTooltip(tooltip, container, param.point);
  };

  useEffect(() => {
    const chart = createChart(containerRef.current, { height: HEIGHT, autoSize: true });
    chartRef.current = chart;
    histogramSeriesRef.current = chart.addSeries(HistogramSeries, { base: 0 });
    difSeriesRef.current = chart.addSeries(LineSeries, { color: DIF_COLOR, lineWidth: 2 });
    signalSeriesRef.current = chart.addSeries(LineSeries, { color: SIGNAL_COLOR, lineWidth: 2 });

    chart.subscribeCrosshairMove(updateTooltip);

    const legend = legendRef.current;
    if (legend) {
      legend.innerHTML = [
        `<div>${legendSwatch(DIF_COLOR)}MACD</div>`,
        `<div>${legendSwatch(SIGNAL_COLOR)}Signal</div>`,
        `<div>${legendSwatch(HISTOGRAM_NEUTRAL_COLOR)}Histogram</div>`,
      ].join('');
    }

    return () => {
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
