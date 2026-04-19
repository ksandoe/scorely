export default function Artwork({ src, alt, size = 56, rounded = 10 }) {
  const s = Number(size)

  if (src) {
    return (
      <img
        src={src}
        alt={alt || ''}
        width={s}
        height={s}
        loading="lazy"
        style={{
          width: s,
          height: s,
          borderRadius: rounded,
          objectFit: 'cover',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      />
    )
  }

  return (
    <div
      aria-label={alt || 'Album artwork'}
      style={{
        width: s,
        height: s,
        borderRadius: rounded,
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    />
  )
}
