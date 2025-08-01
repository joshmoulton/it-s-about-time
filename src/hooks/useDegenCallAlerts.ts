import { useQuery } from '@tanstack/react-query';

interface DegenCall {
  id: string;
  coin: string;
  entry_price: string;
  target_multiplier?: number;
  actual_multiplier?: number;
  outcome: 'hit' | 'miss' | 'pending';
  created_at: string;
}

// Mock data for demonstration
const mockDegenCalls: DegenCall[] = [
  {
    id: '1',
    coin: 'SOLANA',
    entry_price: '0.00234',
    target_multiplier: 2.5,
    actual_multiplier: 3.2,
    outcome: 'hit',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: '2',
    coin: 'PEPE',
    entry_price: '0.000012',
    target_multiplier: 1.8,
    outcome: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: '3',
    coin: 'BONK',
    entry_price: '0.0000045',
    target_multiplier: 2.2,
    outcome: 'miss',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
  },
];

export function useDegenCallAlerts(limit?: number) {
  return useQuery({
    queryKey: ['degenCallAlerts', limit],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return limit ? mockDegenCalls.slice(0, limit) : mockDegenCalls;
    },
    staleTime: 30000, // 30 seconds
  });
}