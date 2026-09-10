// KUKIT's mark: a clock face in a rounded badge, in the app's own palette —
// replaces the plain ⏲ glyph that used to stand in for a logo. Kept as one
// small inline component (rather than a static asset) so it always renders
// in exactly these brand colors regardless of platform emoji fonts.
export default function Logo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="#24211d" stroke="#423c34" strokeWidth="1" />
      <circle cx="20" cy="22" r="11" fill="none" stroke="#e3a333" strokeWidth="2.4" />
      <rect x="16.5" y="5" width="7" height="4.2" rx="2.1" fill="#e3a333" />
      <rect x="25" y="8" width="5.6" height="3.4" rx="1.7" fill="#e3a333" transform="rotate(45 27.8 9.7)" />
      <line x1="20" y1="22" x2="20" y2="15.5" stroke="#f3ede0" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="20" y1="22" x2="24.5" y2="25" stroke="#d6503f" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20" cy="22" r="1.8" fill="#f3ede0" />
    </svg>
  );
}
