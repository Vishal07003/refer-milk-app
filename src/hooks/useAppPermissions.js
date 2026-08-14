import { useEffect } from 'react';
import { requestAppPermissions } from '../services/permissions';
import { initializeNotifications } from '../services/notificationService';

export default function useAppPermissions() {
  useEffect(() => {
    requestAppPermissions().catch(() => {});
    initializeNotifications().catch(() => {});
  }, []);
}
