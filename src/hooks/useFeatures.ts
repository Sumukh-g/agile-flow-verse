import { useEffect, useState } from 'react';

interface Feature {
  key: string;
  enabled: boolean;
  category: 'basic' | 'pro' | 'enterprise';
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

      // In a real app, this would fetch from your API
      // For now, we'll use mock data
      const mockFeatures: Feature[] = [
        { key: 'wbs_gantt', enabled: true, category: 'basic' },
        { key: 'risk_register', enabled: true, category: 'pro' },
        { key: 'ai_insights', enabled: false, category: 'enterprise' },
        { key: 'advanced_analytics', enabled: false, category: 'enterprise' },
        { key: 'custom_integrations', enabled: false, category: 'enterprise' },
        { key: 'priority_support', enabled: false, category: 'enterprise' }
      ];

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setFeatures(mockFeatures);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch features');
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