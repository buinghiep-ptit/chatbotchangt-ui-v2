import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { loadInitialTheme, useWidgetStore } from '@/store/useWidgetStore'

useWidgetStore.setState({ theme: loadInitialTheme() })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
