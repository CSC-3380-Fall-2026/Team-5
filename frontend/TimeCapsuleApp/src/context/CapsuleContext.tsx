import React, { createContext, ReactNode, useContext, useState, useCallback, useMemo } from 'react';

// Defines the structure
export type Memory = {
  id: string;
  text: string;
};
export type Capsule = {
  id: string;
  name: string;
  unlockDate: string;
  friends: string[];
  memories?: string[];
};

type CapsuleContextType = {
  capsules: Capsule[];
  addCapsule: (capsule: Capsule) => void;
};

const CapsuleContext = createContext<CapsuleContextType | undefined>(
  undefined,
);

type CapsuleProviderProps = Readonly<{
  children: ReactNode;
}>;

//saves shared capsule 
export function CapsuleProvider({
  children,
}: CapsuleProviderProps) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);

  const addCapsule = useCallback((capsule: Capsule) => {
  setCapsules(currentCapsules => [
    ...currentCapsules,
    capsule,
  ]);
}, []);
    const contextValue = useMemo(
    () => ({
        capsules,
        addCapsule,
    }),
    [capsules, addCapsule],
    );

  return (
    <CapsuleContext.Provider value={contextValue}>      
    {children}
    </CapsuleContext.Provider>
  );
}

export function useCapsules() {
  const context = useContext(CapsuleContext);

  if (context === undefined) {
    throw new Error(
      'useCapsules must be used inside CapsuleProvider',
    );
  }

  return context;
}