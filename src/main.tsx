import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './components/auth-context'
import { BankProvider } from './components/bank-context'
import { ThemeProvider } from './components/theme'
import { applyUiFontScale, readStoredUiFontScale } from './domain/theme/ui-font-scale'
import './index.css'

applyUiFontScale(readStoredUiFontScale())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BankProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </BankProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
