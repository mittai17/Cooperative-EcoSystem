import { useEffect, useRef } from 'react';

/** Runs `fn` once after the first render (data loaders that set state when they resolve). */
export function useOnMount(fn: () => void | Promise<void>) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current();
  }, []);
}
