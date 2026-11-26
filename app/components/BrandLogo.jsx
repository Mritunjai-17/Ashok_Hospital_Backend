export default function BrandLogo({ compact = false }) {
  const iconSize = compact ? 34 : 40;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? '10px' : '12px' }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect width="40" height="40" rx="11" fill="#5F509B" />
        <circle cx="16.2" cy="20" r="6.8" fill="#FFFFFF" />
        <circle cx="23.8" cy="20" r="6.8" fill="#E3DCF7" fillOpacity="0.92" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: compact ? '16px' : '18.5px',
            fontWeight: 700,
            color: '#14192C',
            letterSpacing: '-0.02em',
          }}
        >
          Dr. Abhinav
        </span>
        <span
          style={{
            fontSize: compact ? '9.5px' : '10.5px',
            fontWeight: 600,
            color: '#5F509B',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginTop: '3px',
          }}
        >
          ASHOK HOSPITAL
        </span>
      </div>
    </div>
  );
}
