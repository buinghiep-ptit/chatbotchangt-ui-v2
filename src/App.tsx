import { Stage } from './components/Stage'
import { Launcher } from './components/Launcher'
import { ChangWidget } from './components/ChangWidget'

export default function App() {
  return (
    <Stage>
      <ChangWidget />
      <Launcher />
    </Stage>
  )
}
