import { getSurface } from '@/lib/surface'
import { Bubble } from './components/Bubble'
import { ChangWidget } from './components/ChangWidget'

export default function App() {
  if (getSurface() === 'bubble') return <Bubble />
  return <ChangWidget />
}
