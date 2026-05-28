import { useCallback, useEffect, useState } from 'react';
import { buildApiUrl } from '../config/api';

const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const useVivaHistory = (token) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/viva/history'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load viva history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveSession = useCallback(
    async (payload) => {
      if (!token) return null;
      const res = await fetch(buildApiUrl('/api/viva/history'), {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to save viva session');
      }
      const data = await res.json();
      await fetchHistory();
      return data;
    },
    [token, fetchHistory],
  );

  const getSessionDetail = useCallback(
    async (sessionId) => {
      if (!token) return null;
      const res = await fetch(buildApiUrl(`/api/viva/history/${sessionId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch session detail');
      }
      return res.json();
    },
    [token],
  );

  const generateAnalysis = useCallback(
    async (sessionId) => {
      if (!token) return null;
      const res = await fetch(buildApiUrl(`/api/viva/history/${sessionId}/analysis`), {
        method: 'POST',
        headers: getAuthHeaders(token),
      });
      if (res.status === 409) {
        const detail = await getSessionDetail(sessionId);
        return detail?.performance_analysis ?? null;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body.detail;
        const message =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail[0]?.msg
              : 'Failed to generate performance analysis';
        throw new Error(message || 'Failed to generate performance analysis');
      }
      const data = await res.json();
      await fetchHistory();
      return data.performance_analysis;
    },
    [token, fetchHistory, getSessionDetail],
  );

  const appendReattempt = useCallback(
    async (sessionId, payload) => {
      if (!token) return null;
      const res = await fetch(buildApiUrl(`/api/viva/history/${sessionId}/reattempt`), {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to save reattempt');
      }
      const data = await res.json();
      await fetchHistory();
      return data;
    },
    [token, fetchHistory],
  );

  return {
    sessions,
    isLoading,
    fetchHistory,
    saveSession,
    getSessionDetail,
    generateAnalysis,
    appendReattempt,
  };
};
