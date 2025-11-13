import React from 'react';

interface PrintChartSectionProps {
  chartPngs: Map<string, string>;
  children: React.ReactNode;
}

export function PrintChartSection({ chartPngs, children }: PrintChartSectionProps) {
  return (
    <>
      {/* Screen version - normal charts */}
      <div className="print:hidden">
        {children}
      </div>
      
      {/* Print version - optimized layout */}
      <div className="hidden print:block">
        <div className="grid grid-cols-2 gap-2">
          {Array.from(chartPngs.entries()).map(([chartId, pngData]) => (
            <div key={chartId} className="border border-gray-300 p-2">
              <img 
                src={pngData} 
                alt={`Chart ${chartId}`}
                className="w-full h-48 object-contain"
                style={{ height: '192px' }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}