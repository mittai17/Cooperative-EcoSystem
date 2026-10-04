"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/employer/candidates-api";

export interface ResourceState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Loads a resource whenever `deps` change. Each run is tagged with a token, so a
 * stale response can never overwrite a newer one and `loading` is derived rather
 * than set synchronously inside the effect.
 */
export function useResource<T>(load: () => Promise<T>, deps: readonly unknown[]): ResourceState<T> {
  const [version, setVersion] = useState(0);
  const token = `${JSON.stringify(deps)}#${version}`;
  const [state, setState] = useState<{ token: string; data: T | null; error: string | null }>({
    token: "",
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setState({ token, data, error: null });
      },
      (err: unknown) => {
        if (active) setState({ token, data: null, error: errorMessage(err) });
      },
    );
    return () => {
      active = false;
    };
    // `token` encodes every dependency and reload request; `load` is recreated per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loading = state.token !== token;
  return {
    data: loading ? null : state.data,
    error: loading ? null : state.error,
    loading,
    reload: () => setVersion((v) => v + 1),
  };
}
