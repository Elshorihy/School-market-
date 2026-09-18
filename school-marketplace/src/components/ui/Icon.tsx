import type { SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'store'
  | 'search'
  | 'plus'
  | 'chat'
  | 'user'
  | 'users'
  | 'heart'
  | 'heart-fill'
  | 'bell'
  | 'sun'
  | 'moon'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'arrow-left'
  | 'x'
  | 'check'
  | 'trash'
  | 'edit'
  | 'flag'
  | 'shield'
  | 'filter'
  | 'map-pin'
  | 'school'
  | 'tag'
  | 'box'
  | 'eye'
  | 'logout'
  | 'settings'
  | 'chart'
  | 'ban'
  | 'warning'
  | 'image'
  | 'clock'
  | 'sparkle'
  | 'send'
  | 'menu'
  | 'globe'
  | 'key'
  | 'link'
  | 'inbox'
  | 'target'
  | 'swap';

const paths: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </>
  ),
  store: (
    <>
      <path d="M4 7 5.5 3h13L20 7" />
      <path d="M4 7h16v3a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-1 0z" />
      <path d="M5 11.5V21h14v-9.5" />
      <path d="M9.5 21v-5h5v5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chat: (
    <>
      <path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12Z" />
      <path d="M8.5 10.5h7M8.5 13.5h4.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 19.5a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.5a3.5 3.5 0 0 1 0 6.6" />
      <path d="M17.5 13.6a6.5 6.5 0 0 1 4 5.9" />
    </>
  ),
  heart: (
    <path d="M12 20.5s-7.5-4.7-9.3-9.2C1.5 8.2 3.6 4.9 6.9 4.9c2 0 3.7 1.1 5.1 3 1.4-1.9 3.1-3 5.1-3 3.3 0 5.4 3.3 4.2 6.4-1.8 4.5-9.3 9.2-9.3 9.2Z" />
  ),
  'heart-fill': (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 20.5s-7.5-4.7-9.3-9.2C1.5 8.2 3.6 4.9 6.9 4.9c2 0 3.7 1.1 5.1 3 1.4-1.9 3.1-3 5.1-3 3.3 0 5.4 3.3 4.2 6.4-1.8 4.5-9.3 9.2-9.3 9.2Z"
    />
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9" />
      <path d="M10 19.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'arrow-left': <path d="M20 12H4m0 0 6-6m-6 6 6 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7 7.5 20h9L17.5 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4.5L20 8.5 15.5 4 4 15.5V20Z" />
      <path d="m13 6.5 4.5 4.5" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4c4-2.5 8 2.5 14 0v9c-6 2.5-10-2.5-14 0" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 4.5 5.5v6c0 5 3.2 8.3 7.5 10 4.3-1.7 7.5-5 7.5-10v-6L12 2.5Z" />
      <path d="m8.8 11.8 2.2 2.2 4.2-4.5" />
    </>
  ),
  filter: <path d="M4 5h16l-6.5 8v5.5L10.5 21v-8L4 5Z" />,
  'map-pin': (
    <>
      <path d="M12 21.5s7-6.5 7-11.5a7 7 0 1 0-14 0c0 5 7 11.5 7 11.5Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  school: (
    <>
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M6.5 11.5V17c1.8 1.4 4 2 5.5 2s3.7-.6 5.5-2v-5.5" />
      <path d="M21 9v5" />
    </>
  ),
  tag: (
    <>
      <path d="m3 12 9-9h9v9l-9 9-9-9Z" />
      <circle cx="16.5" cy="7.5" r="1.3" />
    </>
  ),
  box: (
    <>
      <path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7L12 2.8Z" />
      <path d="M3.5 7 12 11.2 20.5 7M12 11.2v10" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
      <path d="M10 12h10m0 0-3.5-3.5M20 12l-3.5 3.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.15-1.4l2.1-1.6-2-3.4-2.5 1a7 7 0 0 0-2.4-1.4L13.7 2.5h-3.4l-.35 2.7a7 7 0 0 0-2.4 1.4l-2.5-1-2 3.4 2.1 1.6a7 7 0 0 0 0 2.8l-2.1 1.6 2 3.4 2.5-1a7 7 0 0 0 2.4 1.4l.35 2.7h3.4l.35-2.7a7 7 0 0 0 2.4-1.4l2.5 1 2-3.4-2.1-1.6c.1-.45.15-.9.15-1.4Z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-5M12 16V7M16 16v-3M20 16V9" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.7 5.7 12.6 12.6" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 1.8 20.5h20.4L12 3Z" />
      <path d="M12 9.5v5M12 17.5v.5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.8" />
      <path d="m5 18 5-5 3 3 3-2.5L20 18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9-5.7-1.8L10.2 9 12 3.5Z" />
      <path d="M19 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z" />
    </>
  ),
  send: <path d="M21 3 3.5 9.8l6.2 2.5L12.2 19 21 3ZM9.7 12.3 21 3" />,
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="4.5" />
      <path d="m11.5 10.5 8-8M17 5l3 3M14 8l2.5 2.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" />
      <path d="M14 10a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13 6 4h12l3 9v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19v-6Z" />
      <path d="M3 13h5.5a3.5 3.5 0 0 0 7 0H21" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  swap: (
    <>
      <path d="M7 4 3.5 7.5 7 11" />
      <path d="M3.5 7.5H17" />
      <path d="m17 13 3.5 3.5L17 20" />
      <path d="M20.5 16.5H7" />
    </>
  )
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  filled?: boolean;
}

export function Icon({ name, size = 20, filled, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
