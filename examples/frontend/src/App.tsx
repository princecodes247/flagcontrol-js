import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { FlagProvider, useFlag } from '@flagcontrol/react'

function AppContent() {
  const [count, setCount] = useState(0)
  const isNewFeatureEnabled = useFlag('new-feature', false)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + Flagcontrol</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      <div className="card">
        <h2>Feature Flag Status</h2>
        <p>
          Flag 'new-feature' is: <strong>{isNewFeatureEnabled ? 'ENABLED' : 'DISABLED'}</strong>
        </p>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

function App() {
  return (
    <FlagProvider config={{ sdkKey: 'test-sdk-key' }}>
      <AppContent />
    </FlagProvider>
  )
}

export default App
