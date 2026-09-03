// Shared bits for the lightweight-charts (TradingView) based chart components in this
// folder: colors, number formatting, and the crosshair-driven tooltip positioning/bounds
// logic every chart's `subscribeCrosshairMove` handler needs.

export const UP_COLOR = '#26a69a';
export const DOWN_COLOR = '#ef5350';
export const LINE_COLORS = ['#f5a623', '#2962ff', '#9c27b0'];

export const fmt = n => (n == null ? '-' : n.toFixed(2));

export const legendSwatch = color =>
  `<span style="display:inline-block;width:10px;height:10px;background:${color};` +
  `margin-right:4px;border-radius:2px;vertical-align:middle;"></span>`;

export const isOutOfBounds = (param, container) =>
  !param?.point ||
  param.point.x < 0 ||
  param.point.x > container.clientWidth ||
  param.point.y < 0 ||
  param.point.y > container.clientHeight;

// Measures the tooltip's own (already-rendered) size so it clamps correctly regardless of
// how many rows its content has.
export const positionTooltip = (tooltip, container, point) => {
  const left = Math.min(Math.max(point.x + 16, 0), container.clientWidth - tooltip.offsetWidth);
  const top = Math.min(Math.max(point.y + 16, 0), container.clientHeight - tooltip.offsetHeight);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
};
