import { Link } from 'react-router-dom'
import Artwork from './Artwork.jsx'

export default function SongCard({ song, rightSlot, footerSlot, to }) {
  const href = to || `/songs/${song.songId}`

  return (
    <div className="songCard">
      <div className="songCardTop">
        <div className="songCardPoster">
          <Link to={href} className="songCardArt" aria-label={`Open ${song.title} by ${song.artist}`}>
            <Artwork src={song.albumArt} alt={`${song.title} album art`} size={64} rounded={12} />
          </Link>
        </div>

        <div className="songCardBody">
          <div className="songCardTitleRow">
            <Link to={href} className="songCardTitle">
              {song.title}
            </Link>
            {rightSlot ? <div className="songCardRight">{rightSlot}</div> : null}
          </div>

          <div className="songCardMeta">
            <span>{song.artist}</span>
            {song.releaseYear ? <span className="dot">•</span> : null}
            {song.releaseYear ? <span>{song.releaseYear}</span> : null}
            {song.genre ? <span className="dot">•</span> : null}
            {song.genre ? <span>{song.genre}</span> : null}
          </div>

          {footerSlot ? <div className="songCardFooter">{footerSlot}</div> : null}
        </div>
      </div>
    </div>
  )
}
