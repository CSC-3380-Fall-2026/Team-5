import React, {createContext,ReactNode,useContext,useState, useCallback,useMemo,} from 'react';

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
  reload: () => void;
  addCapsule: (capsule: Capsule) => void;
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
  const loading = false;
  const error: string | null = null;
  const reload = useCallback(() => {}, []);
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