import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

import { API_BASE_URL } from '../services/api';
import { getAuthToken } from '../services/authStorage';
// Defines the structure of one memory
export type Memory = { id: string; text: string;   photoUri: string;};

// Defines the structure of one capsule
export type Capsule = {
  id: string;
  name: string;
  unlockDate: string;
  friends: string[];
  memories?: Memory[];
};

// Defines what data/functions are available through the capsule context
type CapsuleContextType = {
  capsules: Capsule[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;  addCapsule: (capsule: Capsule) => void;
  addMemory: (capsuleId: string, memory: Memory) => void;
};

const CapsuleContext = createContext<CapsuleContextType | undefined>(
  undefined,
);

type CapsuleProviderProps = Readonly<{
  children: ReactNode;
}>;

// Saves and shares capsule data throughout the app
export function CapsuleProvider({
  children,
}: CapsuleProviderProps) {

  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Retrieve saved capsules from MySQL.
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();

      if (!token) {
        setCapsules([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/capsules`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load capsules.');
      }

      const savedCapsules: Capsule[] = data.capsules.map(
        (capsule: any) => {
          const rawDate = String(capsule.unlockDate);
          const dateOnly = rawDate.slice(0, 10);
          const [year, month, day] = dateOnly.split('-');

          return {
            id: String(capsule.id),
            name: capsule.name,
            unlockDate: `${Number(month)}/${Number(day)}/${year}`,
            friends: capsule.friends ?? [],
          };
        },
      );

      setCapsules(savedCapsules);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load capsules.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load capsules automatically when the provider mounts.
  useEffect(() => {
    reload();
  }, [reload]);

  // Adds a new capsule
  const addCapsule = useCallback((capsule: Capsule) => {
    setCapsules(currentCapsules => [
      ...currentCapsules,
      capsule,
    ]);
  }, []);

  // Adds a memory to a specific capsule
  const addMemory = useCallback(
    (capsuleId: string, memory: Memory) => {
      setCapsules(currentCapsules =>
        currentCapsules.map(capsule => {
          if (capsule.id !== capsuleId) {
            return capsule;
          }

          return {
            ...capsule,
            memories: [
              ...(capsule.memories ?? []),
              memory,
            ],
          };
        }),
      );
    },
    [],
  );

  // Makes the shared values available to the rest of the app
  const contextValue = useMemo(
    () => ({
      capsules,
      loading,
      error,
      reload,
      addCapsule,
      addMemory,
    }),
    [capsules, loading, error, reload, addCapsule, addMemory],
  );

  return (
    <CapsuleContext.Provider value={contextValue}>
      {children}
    </CapsuleContext.Provider>
  );
}

// Custom hook used by screens/components to access capsule data
export function useCapsules() {
  const context = useContext(CapsuleContext);

  if (context === undefined) {
    throw new Error(
      'useCapsules must be used inside CapsuleProvider',
    );
  }

  return context;
}