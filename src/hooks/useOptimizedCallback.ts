import { useCallback, useRef } from 'react';

export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);

  // Only update if dependencies actually changed
  const depsChanged = deps.some((dep, index) => dep !== depsRef.current[index]);
  
  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return useCallback(callbackRef.current, deps) as T;
};

export const useStableMemo = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  const valueRef = useRef<T>();
  const depsRef = useRef(deps);

  const depsChanged = deps.some((dep, index) => dep !== depsRef.current[index]);
  
  if (!valueRef.current || depsChanged) {
    valueRef.current = factory();
    depsRef.current = deps;
  }

  return valueRef.current;
};