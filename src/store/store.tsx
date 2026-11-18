import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { State } from './types';
import { reduce, type Action } from './reducer';
import { createSeed, STATE_VERSION } from '../data/seed';

const KEY = 'linewalk.state.v' + STATE_VERSION;

let counter = 0;
const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`;

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return createSeed();
}

interface StoreValue {
  state: State;
  dispatch: (a: Action) => void;
  now: number;
  toast: (msg: string) => void;
  toastMsg: string | null;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(
    (s: State, a: Action) => reduce(s, a, { now: Date.now(), id: makeId }),
    undefined,
    load,
  );
  const [now, setNow] = useState(Date.now());
  const [toastMsg, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota exceeded or storage blocked: demo keeps working in memory */
    }
  }, [state]);

  // Tick every 30 s so "2m ago" labels and check-in expiry stay current.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const dispatch = useCallback((a: Action) => {
    setNow(Date.now());
    rawDispatch(a);
  }, []);

  const toast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 2400);
  }, []);

  const value = useMemo(() => ({ state, dispatch, now, toast, toastMsg }), [state, dispatch, now, toast, toastMsg]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
