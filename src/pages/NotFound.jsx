import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Empty } from '../components/ui'

export default function NotFound() {
  return (
    <div className="container section">
      <Empty icon={Compass} title="Page not found">
        <p>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </Empty>
    </div>
  )
}
