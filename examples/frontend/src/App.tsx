import './App.css'
import { FlagProvider, useFlag } from '@flagcontrol/react'

function AppContent() {
  const isNewFeatureEnabled = useFlag('new-feature', false)
  return (
    <>
      <div className="card">
        <h2>Feature Flag Status</h2>
        <p>
          Flag 'new-feature' is: <strong>{isNewFeatureEnabled ? 'ENABLED' : 'DISABLED'}</strong>
        </p>
      </div>
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
