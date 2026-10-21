import { useEffect } from 'react';
import { requestAppPermissions } from '../services/permissions';

export default function useAppPermissions() {
  useEffect(() => {
    // Requests runtime OS permissions (Location, Android 13+ POST_NOTIFICATIONS)
    requestAppPermissions().catch(() => {});
  }, []);
}
