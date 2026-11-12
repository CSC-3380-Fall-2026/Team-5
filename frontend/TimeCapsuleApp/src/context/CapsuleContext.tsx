
import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

import {API_BASE_URL} from '../services/api';
import {getAuthToken} from '../services/authStorage';

// Defines the structure of one memory
export type Memory = {
  id: string;
  text: string;
  photoUri: string;
};

// Defines the structure of one capsule
export type Capsule = {
  id: string;
  name: string;
  unlockDate: string;
  friends: string[];
  memories?: Memory[];
  memoryCount?: number;
};

// Defines what data/functions are available through the capsule context
type CapsuleContextType = {
  capsules: Capsule[];
  loading: boolean;
  error: string | null;
  // Reload fetches saved capsules asynchronously and reports failures through error.
  reload: () => Promise<void>;
  addCapsule: (capsule: Capsule) => void;
  addMemory: (capsuleId: string, memory: Memory) => void;
  setCapsulesFromBackend: (capsules: Capsule[]) => void;
};

const CapsuleContext = createContext<CapsuleContextType | undefined>(
  undefined,
);

type CapsuleProviderProps = Readonly<{
  children: ReactNode;
}>;

// Saves and shares capsule data throughout the app
export function CapsuleProvider({children}: CapsuleProviderProps) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loads the logged-in user's capsules from the backend
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();

      if (!token) {
        setCapsules([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/capsules`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to load capsules.');
        return;
      }

      const loadedCapsules: Capsule[] = data.capsules.map(
        (capsule: any) => {
          const unlockDate = new Date(capsule.opensAt);

      return {
        id: capsule.id,
        name: capsule.title,
        unlockDate: `${
          unlockDate.getMonth() + 1
        }/${unlockDate.getDate()}/${unlockDate.getFullYear()}`,

        friends: (capsule.members ?? [])
          .filter(
            (member: {id: string; name: string}) =>
              member.id !== capsule.createdBy,
          )
          .map(
            (member: {id: string; name: string}) =>
              member.name,
          ),

        memories: [],
        memoryCount: capsule.memoryCount ?? 0,
      };
        },
      );

      setCapsules(loadedCapsules);
    } catch (error) {
      console.error('Capsule loading error:', error);
      setError('Could not connect to the Time Capsule server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Adds a new capsule
  const addCapsule = useCallback((capsule: Capsule) => {
    setCapsules(currentCapsules => [
      ...currentCapsules,
      capsule,
    ]);
  }, []);

  // Replaces the current capsule list with capsules loaded from the backend
  const setCapsulesFromBackend = useCallback(
    (backendCapsules: Capsule[]) => {
      setCapsules(backendCapsules);
    },
    [],
  );

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
        memoryCount: (capsule.memoryCount ?? 0) + 1,
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
      setCapsulesFromBackend,
    }),
    [
      capsules,
      loading,
      error,
      reload,
      addCapsule,
      addMemory,
      setCapsulesFromBackend,
    ],
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
