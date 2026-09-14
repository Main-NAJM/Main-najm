/** أيقونات SVG بسيطة (بدون مكتبات خارجية). */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const HomeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V9.5" />
  </svg>
);

export const OrdersIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8 4h8a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2V5a1 1 0 0 1 1-1Z" />
    <path d="M8 11h8M8 15h5" />
  </svg>
);

export const CalendarIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3.5V6M16 3.5V6" />
    <path d="M7.5 13h3v3h-3z" />
  </svg>
);

export const DebtIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 7.5C4 6 7.6 4.8 12 4.8s8 1.2 8 2.7-3.6 2.7-8 2.7-8-1.2-8-2.7Z" />
    <path d="M4 7.5v9c0 1.5 3.6 2.7 8 2.7s8-1.2 8-2.7v-9" />
    <path d="M4 12c0 1.5 3.6 2.7 8 2.7s8-1.2 8-2.7" />
  </svg>
);

export const CalculatorIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8.5 7h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5v3.5M8.5 18h3.5" />
  </svg>
);

export const PriceIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 19V5M4 19h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </svg>
);

export const PrintIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M7 8V4h10v4" />
    <rect x="4" y="8" width="16" height="8" rx="2" />
    <path d="M7 13h10v7H7z" />
  </svg>
);

export const SettingsIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.9 6.1l-1.4 1.4M7.5 16.5l-1.4 1.4M17.9 17.9l-1.4-1.4M7.5 7.5 6.1 6.1" />
  </svg>
);

export const MoreIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="5.5" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="18.5" cy="12" r="1.4" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ProductIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3.2 20 7.4v9.2L12 20.8 4 16.6V7.4Z" />
    <path d="M4 7.4 12 11.6l8-4.2M12 11.6v9.2" />
  </svg>
);
