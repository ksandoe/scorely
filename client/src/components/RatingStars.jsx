export default function RatingStars({ value, outOf = 5, size = 14 }) {
  const v = Number(value) || 0
  const total = Number(outOf) || 5

  const filled = '★'.repeat(Math.max(0, Math.min(total, v)))
  const empty = '☆'.repeat(Math.max(0, total - v))

  return (
    <span style={{ fontSize: size, letterSpacing: 1 }} aria-label={`${v} out of ${total} stars`}>
      <span style={{ color: 'var(--gold)' }}>{filled}</span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>{empty}</span>
    </span>
  )
}
