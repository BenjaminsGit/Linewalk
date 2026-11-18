const PATHS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  pin: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z|C12 9 2.5',
  plus: 'M12 5v14M5 12h14',
  user: 'C12 8 4|M4 21a8 8 0 0 1 16 0',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9|M10.3 21a1.9 1.9 0 0 0 3.4 0',
  search: 'C11 11 7|M20 20l-3.5-3.5',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  calendar: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M3 10h18M8 3v4M16 3v4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  lock: 'M6 11h12v10H6z|M8 11V7a4 4 0 0 1 8 0v4',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z|M9 12l2 2 4-4',
  check: 'M5 12l5 5 9-10',
  flag: 'M5 21V4|M5 4h11l-2 4 2 4H5',
  camera: 'M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|C12 13 3.5',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  send: 'M4 12l16-8-6 16-2.5-6.5z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  people: 'C9 8 3.5|M2 20a7 7 0 0 1 14 0|M16 4.5a3.5 3.5 0 0 1 0 7|M22 20a7 7 0 0 0-4-6.3',
  ruler: 'M3 17L17 3l4 4L7 21z|M7 13l2 2M10 10l2 2M13 7l2 2',
  wind: 'M3 8h10a3 3 0 1 0-3-3|M3 12h15a3 3 0 1 1-3 3|M3 16h7',
  doc: 'M6 3h9l4 4v14H6z|M14 3v5h5|M9 13h7M9 17h7',
  more: 'C5 12 1.2|C12 12 1.2|C19 12 1.2',
  locate: 'C12 12 3|M12 2v3M12 19v3M2 12h3M19 12h3',
  logout: 'M15 4h4v16h-4|M10 8l-4 4 4 4|M6 12h10',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7|M20 4v7h-7',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, fill = 'none', strokeWidth = 2 }: { name: IconName; size?: number; fill?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name].split('|').map((d, i) => {
        if (d.startsWith('C')) {
          const [cx, cy, r] = d.slice(1).trim().split(/\s+/).map(Number);
          return <circle key={i} cx={cx} cy={cy} r={r} fill={name === 'more' ? 'currentColor' : 'none'} />;
        }
        return <path key={i} d={d} fill={i === 0 ? fill : 'none'} />;
      })}
    </svg>
  );
}
