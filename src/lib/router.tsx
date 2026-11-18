import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ID } from '../store/types';

/**
 * A tiny in-memory stack router. The demo avoids URL routing so it runs the
 * same in GitHub Pages, sandboxed previews and file:// without config.
 * In production this maps 1:1 onto Expo Router screens.
 */
export type Tab = 'feed' | 'spots' | 'log' | 'profile';

export type Route =
  | { name: 'feed' }
  | { name: 'spots' }
  | { name: 'log'; spotId?: ID }
  | { name: 'profile'; userId?: ID }
  | { name: 'post'; postId: ID }
  | { name: 'spot'; spotId: ID }
  | { name: 'addSpot'; lat?: number; lng?: number; city?: string }
  | { name: 'meetup'; meetupId: ID }
  | { name: 'createMeetup'; spotId?: ID }
  | { name: 'notifications' }
  | { name: 'settings' }
  | { name: 'editProfile' }
  | { name: 'addGear' }
  | { name: 'people' }
  | { name: 'plan' };

const TAB_ROUTES: Tab[] = ['feed', 'spots', 'log', 'profile'];

interface RouterValue {
  route: Route;
  tab: Tab;
  depth: number;
  push: (r: Route) => void;
  back: () => void;
  switchTab: (t: Tab) => void;
  replace: (r: Route) => void;
}

const Ctx = createContext<RouterValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [stacks, setStacks] = useState<Record<Tab, Route[]>>({
    feed: [{ name: 'feed' }],
    spots: [{ name: 'spots' }],
    log: [{ name: 'log' }],
    profile: [{ name: 'profile' }],
  });
  const [tab, setTab] = useState<Tab>('feed');

  const scrollTop = () => requestAnimationFrame(() => document.getElementById('screen')?.scrollTo(0, 0));

  const push = useCallback((r: Route) => {
    const isTabRoot = (TAB_ROUTES as string[]).includes(r.name) && !(r.name === 'profile' && r.userId);
    if (isTabRoot) {
      setTab(r.name as Tab);
      setStacks((s) => ({ ...s, [r.name]: [r] }));
    } else {
      setStacks((s) => ({ ...s, [tab]: [...s[tab], r] }));
    }
    scrollTop();
  }, [tab]);

  const replace = useCallback((r: Route) => {
    setStacks((s) => ({ ...s, [tab]: [...s[tab].slice(0, -1), r] }));
    scrollTop();
  }, [tab]);

  const back = useCallback(() => {
    setStacks((s) => (s[tab].length > 1 ? { ...s, [tab]: s[tab].slice(0, -1) } : s));
    scrollTop();
  }, [tab]);

  const switchTab = useCallback((t: Tab) => {
    // Tapping the active tab pops to its root, like native apps.
    if (t === tab) setStacks((s) => ({ ...s, [t]: [s[t][0]] }));
    setTab(t);
    scrollTop();
  }, [tab]);

  const stack = stacks[tab];
  const value = useMemo(
    () => ({ route: stack[stack.length - 1], tab, depth: stack.length, push, back, switchTab, replace }),
    [stack, tab, push, back, switchTab, replace],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRouter() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRouter outside RouterProvider');
  return v;
}
