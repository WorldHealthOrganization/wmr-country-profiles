import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";

export type ChartRefLike = { toBase64Image: (opts?: any) => string } | null;
export type ContainerRefLike = HTMLDivElement | null;

/**
 * Provides setters for chart refs and returns PNG data URLs to use in print.
 * Render at higher DPR (2x) for sharper print.
 */
export function useSnapshots() {
  const chartRefs = useRef<Map<string, ChartRefLike>>(new Map());
  const containerRefs = useRef<Map<string, ContainerRefLike>>(new Map());
  const [chartPngs, setChartPngs] = useState<Map<string, string>>(new Map());

  const setChartRef = useCallback((id: string, ref: ChartRefLike) => {
    chartRefs.current.set(id, ref);
  }, []);

  const setContainerRef = useCallback((id: string, ref: ContainerRefLike) => {
    containerRefs.current.set(id, ref);
  }, []);
  const getChartPng = useCallback((id: string) => chartPngs.get(id) || "", [chartPngs]);

  const prepareSnapshots = useCallback(async () => {
    const oldDpr = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });

    const newChartPngs = new Map<string, string>();
    try {
      // Capture chart canvases
      for (const [id, ref] of chartRefs.current.entries()) {
        if (ref?.toBase64Image) {
          const png = ref.toBase64Image(); // Chart.js honors DPR for sharpness
          newChartPngs.set(id, png);
        }
      }
      
      // Capture container divs (for components like Chart9 with custom legends)
      for (const [id, ref] of containerRefs.current.entries()) {
        if (ref) {
          const canvas = await html2canvas(ref, {
            scale: 2, // 2x DPR for print quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });
          const png = canvas.toDataURL('image/png');
          newChartPngs.set(id, png);
        }
      }
      
      setChartPngs(newChartPngs);
    } catch (error) {
      console.error("[useSnapshots] Error during snapshot preparation:", error);
    } finally {
      Object.defineProperty(window, "devicePixelRatio", { value: oldDpr, configurable: true });
    }
  }, []);

  return {
    setChartRef,
    setContainerRef,
    getChartPng,
    prepareSnapshots,
  };
}