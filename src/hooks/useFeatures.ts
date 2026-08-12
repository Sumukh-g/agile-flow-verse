import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Feature {
  key: string;
  enabled: boolean;
  category: string;
  name?: string;
  description?: string | null;
}

interface UseFeaturesReturn {
  features: Feature[];
  isLoading: boolean;
  error: string | null;
  isFeatureEnabled: (key: string) => boolean;
  refetch: () => Promise<void>;
}

export const useFeatures = (): UseFeaturesReturn => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await apiClient.get<Feature[]>('/features');
      setFeatures(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch features');
      setFeatures([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isFeatureEnabled = (key: string): boolean => {
    const feature = features.find(f => f.key === key);
    return feature?.enabled ?? false;
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  return {
    features,
    isLoading,
    error,
    isFeatureEnabled,
    refetch: fetchFeatures
  };
}; 