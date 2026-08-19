import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads something from the API and keeps the three states a screen needs:
 * what came back, whether it is still loading, and what went wrong.
 *
 *   const { data, loading, error, reload } = useApi(() => fetchDashboard(), []);
 *
 * The loader re-runs whenever a value in `deps` changes. A response that
 * arrives after the screen has moved on is thrown away, so a slow request
 * cannot overwrite a newer one.
 */
export function useApi<T>(
  loader: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
  options: { skip?: boolean } = {},
) {
  const { skip = false } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);

  /** Bumped on every run; a result from an older run is ignored. */
  const runId = useRef(0);

  /**
   * The loader is a new closure on every render, so it cannot be a dependency
   * without re-running forever. It is held in a ref, and the *values* in `deps`
   * decide when to reload instead.
   */
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const depsKey = JSON.stringify(deps);

  const run = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }

    const id = (runId.current += 1);
    setLoading(true);
    setError(null);

    try {
      const result = await loaderRef.current();
      if (runId.current === id) {
        setData(result);
      }
    } catch (caught) {
      if (runId.current === id) {
        setError(caught instanceof Error ? caught : new Error('Something went wrong.'));
      }
    } finally {
      if (runId.current === id) {
        setLoading(false);
      }
    }
    /** depsKey stands in for the caller's deps; see the ref above. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, depsKey]);

  useEffect(() => {
    run();
    /** A pending result is discarded if the screen unmounts first. */
    return () => {
      runId.current += 1;
    };
  }, [run]);

  return { data, loading, error, reload: run, setData };
}
