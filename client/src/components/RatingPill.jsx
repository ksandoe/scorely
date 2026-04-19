import RatingStars from './RatingStars.jsx'

export default function RatingPill({ value }) {
  const v = Number(value) || 0
  return (
    <span className="ratingPill" title={`${v} / 5`}>
      <RatingStars value={v} />
      <span className="ratingPillNum">{v}</span>
    </span>
  )
}
