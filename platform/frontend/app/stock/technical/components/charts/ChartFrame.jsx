'use client';

// Shared layout for every chart in this folder: a chart container with a floating legend
// (top-left, color+name only) and a floating tooltip (follows the crosshair), both drawn as
// plain HTML overlays since lightweight-charts has no built-in legend/tooltip.
const ChartFrame = ({ containerRef, legendRef, tooltipRef, height }) => (
  <div style={{ position: 'relative' }}>
    <div
      ref={legendRef}
      style={{
        position: 'absolute',
        left: 12,
        top: 8,
        zIndex: 20,
        fontSize: 12,
        lineHeight: '20px',
        background: 'rgba(255,255,255,0.85)',
        padding: '4px 8px',
        borderRadius: 4,
        pointerEvents: 'none',
      }}
    />
    <div
      ref={tooltipRef}
      style={{
        position: 'absolute',
        display: 'none',
        zIndex: 21,
        padding: 8,
        fontSize: 12,
        lineHeight: '16px',
        background: 'white',
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
      }}
    />
    <div ref={containerRef} style={{ width: '100%', height }} />
  </div>
);

export default ChartFrame;
