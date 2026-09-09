'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { message } from 'antd';

// Cross-pane synchronization for the independent lightweight-charts instances on the
// Technical Analysis page (Price/MA, Volume, RSI, MACD, Bollinger Bands): each pane
// registers itself here on mount, and broadcasts its own user-driven crosshair moves and
// zoom/pan changes to every other registered pane. See platform/docs/FunctionSpec.md 1.4
// 圖表結構 (cross-pane synchronized crosshair/tooltip and zoom) and 鎖定模式 (Lock Mode).
//
// A pane registers `{ applyCrosshair(time), applyRange(range) }`; broadcastCrosshair/
// broadcastRange call those on every *other* registered pane.
//
// Lock Mode: `lock` is reactive (React state, unlike the pane registry above which is a
// plain ref-based map) so each pane's own lock-reaction effect re-renders when it changes.
// Clicking any pane calls `toggleLock(time)`, which fires an antd `message` toast on entry;
// while locked, panes ignore hover-driven crosshair moves and pin themselves to `lock.time`
// instead (see each chart component's `updateTooltip`/lock effect), and disable their own
// zoom/pan handling so mouse-wheel scrolling falls through to the page.
const ChartSyncContext = createContext(null);

export const ChartSyncProvider = ({ children, resetKey }) => {
  const panesRef = useRef(null);
  if (!panesRef.current) panesRef.current = new Map();
  const panes = panesRef.current;

  const [lock, setLock] = useState({ locked: false, time: null });
  const lockRef = useRef(lock);
  lockRef.current = lock;

  const apiRef = useRef(null);
  if (!apiRef.current) {
    apiRef.current = {
      registerPane(id, pane) {
        panes.set(id, pane);
      },
      unregisterPane(id) {
        panes.delete(id);
      },
      // lightweight-charts' setCrosshairPosition never re-fires subscribeCrosshairMove on the
      // chart it's called on (it's a "skip event" synthetic position), so only the pane where
      // the user is actually hovering ever calls this — no re-entrancy guard needed.
      broadcastCrosshair(sourceId, time) {
        panes.forEach((pane, id) => {
          if (id !== sourceId) pane.applyCrosshair(time);
        });
      },
      // Zoom/pan sync: setVisibleLogicalRange's own change event fires asynchronously (next
      // animation frame), so a synchronous re-entrancy flag wouldn't reliably stop feedback
      // loops here. Instead each pane's own `applyRange` (see the chart components) no-ops
      // when it's already at the target range, which is what actually breaks the loop.
      broadcastRange(sourceId, range) {
        panes.forEach((pane, id) => {
          if (id !== sourceId) pane.applyRange(range);
        });
      },
      // Toggles the single page-wide Lock Mode switch. Entering lock requires a valid date
      // (ignored otherwise, e.g. a click on empty chart space); leaving lock always succeeds
      // regardless of where the unlocking click landed.
      toggleLock(time) {
        if (lockRef.current.locked) {
          setLock({ locked: false, time: null });
        } else if (time != null) {
          message.info(`已鎖定於 ${time}，再次點擊圖表可解除`);
          setLock({ locked: true, time });
        }
      },
    };
  }

  // Reset Lock Mode whenever the underlying chart data is replaced wholesale (new query or
  // Drawer apply) — a locked date from the previous dataset is not guaranteed to still mean
  // anything under the new one.
  useEffect(() => {
    setLock(prev => (prev.locked ? { locked: false, time: null } : prev));
  }, [resetKey]);

  const value = { ...apiRef.current, lock };

  return <ChartSyncContext.Provider value={value}>{children}</ChartSyncContext.Provider>;
};

export const useChartSync = () => useContext(ChartSyncContext);
