import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

type ReportFn = (metric: Metric) => void;

const reportWebVitals = (onPerfEntry?: ReportFn) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
    onINP(onPerfEntry);
  }
};

export default reportWebVitals;
