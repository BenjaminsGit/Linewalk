import { useStore } from './store/store';
import { useRouter, type Route, type Tab } from './lib/router';
import { Icon, type IconName } from './components/Icon';
import { FeedScreen } from './screens/Feed';
import { PostDetailScreen } from './screens/PostDetail';
import { SpotsScreen } from './screens/Spots';
import { SpotDetailScreen } from './screens/SpotDetail';
import { AddSpotScreen } from './screens/AddSpot';
import { LogSessionScreen } from './screens/LogSession';
import { CreateMeetupScreen, MeetupScreen } from './screens/Meetup';
import { AddGearScreen, EditProfileScreen, ProfileScreen } from './screens/Profile';
import { NotificationsScreen, Onboarding, PeopleScreen, PlanScreen, SettingsScreen } from './screens/Misc';

function renderRoute(r: Route) {
  switch (r.name) {
    case 'feed': return <FeedScreen />;
    case 'spots': return <SpotsScreen />;
    case 'log': return <LogSessionScreen spotId={r.spotId} />;
    case 'profile': return <ProfileScreen userId={r.userId} />;
    case 'post': return <PostDetailScreen postId={r.postId} />;
    case 'spot': return <SpotDetailScreen spotId={r.spotId} />;
    case 'addSpot': return <AddSpotScreen lat={r.lat} lng={r.lng} city={r.city} />;
    case 'meetup': return <MeetupScreen meetupId={r.meetupId} />;
    case 'createMeetup': return <CreateMeetupScreen spotId={r.spotId} />;
    case 'notifications': return <NotificationsScreen />;
    case 'settings': return <SettingsScreen />;
    case 'editProfile': return <EditProfileScreen />;
    case 'addGear': return <AddGearScreen />;
    case 'people': return <PeopleScreen />;
    case 'plan': return <PlanScreen />;
  }
}

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'feed', label: 'Feed', icon: 'home' },
  { id: 'spots', label: 'Spots', icon: 'pin' },
  { id: 'log', label: 'Log', icon: 'plus' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export function App() {
  const { state, toastMsg } = useStore();
  const { route, tab, switchTab, depth } = useRouter();
  const isMap = route.name === 'spots';

  return (
    <div className="frame">
      <main
        id="screen"
        className="screen"
        // The map manages its own scrolling and fills the screen.
        style={isMap ? { overflow: 'hidden', paddingBottom: 0 } : undefined}
        key={`${tab}:${depth}:${route.name}`}
      >
        {renderRoute(route)}
      </main>

      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} onClick={() => switchTab(t.id)} className={t.id === 'log' ? 'log-btn' : undefined}>
            {t.id === 'log' ? <span className="circle"><Icon name="plus" size={24} strokeWidth={2.5} /></span> : <Icon name={t.icon} size={24} />}
            {t.label}
          </button>
        ))}
      </nav>

      {toastMsg && <div className="toast" role="status" aria-live="polite">{toastMsg}</div>}
      {!state.onboarded && <Onboarding />}
    </div>
  );
}
