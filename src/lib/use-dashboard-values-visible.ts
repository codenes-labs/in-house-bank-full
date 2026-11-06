import { useEffect, useState } from 'react';
import {
  DASHBOARD_VALUES_VISIBILITY_STORAGE_KEY,
  parseStoredDashboardValuesVisible,
  serializeDashboardValuesVisible,
} from '../domain/dashboard/dashboard-values-visibility';

export function useDashboardValuesVisible() {
  const [valuesVisible, setValuesVisible] = useState(() =>
    parseStoredDashboardValuesVisible(localStorage.getItem(DASHBOARD_VALUES_VISIBILITY_STORAGE_KEY)),
  );

  useEffect(() => {
    localStorage.setItem(
      DASHBOARD_VALUES_VISIBILITY_STORAGE_KEY,
      serializeDashboardValuesVisible(valuesVisible),
    );
  }, [valuesVisible]);

  function toggleValuesVisible() {
    setValuesVisible((current) => !current);
  }

  return { valuesVisible, setValuesVisible, toggleValuesVisible };
}
