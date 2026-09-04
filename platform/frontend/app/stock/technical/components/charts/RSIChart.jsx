'use client';

import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import { createChart, LineSeries, LineStyle } from 'lightweight-charts';
import ChartFrame from './ChartFrame';
import { LINE_COLORS, fmt, isOutOfBounds, legendSwatch, positionTooltip } from './chartUtils';

const HEIGHT = 250;
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
// reference lines, built with lightweight-charts.
const RSIChart = ({ data }) => {
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

  const updateTooltip = param => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !tooltip || rsiSeriesRef.current.length === 0) return;

    const first = param?.time ? param.seriesData.get(rsiSeriesRef.current[0].series) : null;
    if (!first || isOutOfBounds(param, container)) {
      tooltip.style.display = 'none';
      return;
    }

    const rows = rsiSeriesRef.current
      .map(({ key, color, series }) => {
        const point = param.seriesData.get(series);
        return `<div>${legendSwatch(color)}${key}：${fmt(point?.value)}</div>`;
      })
      .join('');

    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px;">${param.time}</div>
      ${rows}
    `;
    positionTooltip(tooltip, container, param.point);
  };

  useEffect(() => {
    const chart = createChart(containerRef.current, { height: HEIGHT, autoSize: true });
    chartRef.current = chart;

    chart.subscribeCrosshairMove(updateTooltip);

    return () => {
      chart.remove();
      chartRef.current = null;
      rsiSeriesRef.current = [];
    };
  }, []);

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
