import { useEffect } from 'react';
import { requestAppPermissions } from '../services/permissions';

export default function useAppPermissions() {
  useEffect(() => {
    requestAppPermissions().catch(() => {});
  }, []);
}
