"use client";

import { storage, type AppStore } from "@toyonix/web-kit/storage";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PANELS, PANELS_KEY, parsePanels, type PanelName, type Panels } from "@/lib/panels";

export type PanelStore = Pick<AppStore, "get" | "set">;

/**
 * Which workspace panels are open, remembered in `storage.app` so the layout survives a
 * reload. `store` must be stable (a module-level constant).
 */
export function usePanels(store: PanelStore = storage.app) {
  const [panels, setPanels] = useState<Panels>(DEFAULT_PANELS);

  useEffect(() => {
    // Reading storage has to wait for the browser; the first render matches the static HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPanels(parsePanels(store.get(PANELS_KEY)));
  }, [store]);

  const setPanel = useCallback(
    (name: PanelName, open: boolean) => {
      setPanels((current) => {
        const next = { ...current, [name]: open };
        // A refused save only loses the layout preference, not the user's work: not reported.
        store.set(PANELS_KEY, next);
        return next;
      });
    },
    [store],
  );

  return { panels, setPanel };
}
