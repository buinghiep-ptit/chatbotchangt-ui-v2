import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import App from './App'
import './index.css'
import { loadInitialTheme, useWidgetStore } from '@/store/useWidgetStore'

useWidgetStore.setState({ theme: loadInitialTheme() })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>,
)
