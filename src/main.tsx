import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './site/App'
import InternalApp from './app/InternalApp'
import './site/styles.css'

const Page = window.location.pathname === '/app' || window.location.pathname.startsWith('/app/') ? InternalApp : App

createRoot(document.getElementById('root')!).render(<React.StrictMode><Page /></React.StrictMode>)
