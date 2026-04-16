import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main>
      <h1>Not Found</h1>
      <p>This route does not exist.</p>
      <p>
        <Link to="/">Go home</Link>
      </p>
    </main>
  )
}
