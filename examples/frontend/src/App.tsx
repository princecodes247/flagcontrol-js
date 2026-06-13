import './App.css'
import { FlagProvider, useFlag, useFlagControl } from '@flagcontrol/react'

function AppContent() {
  const isNewFeatureEnabled = useFlag("go-flag", false);
  const client = useFlagControl()
  client.addToList('new-feature', {
    key: 'user-id',
  })
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
    <FlagProvider config={{ pollingIntervalMs: 2000, sdkKey: 'test-sdk-key', }}>
      <AppContent />
    </FlagProvider>
  )
}

export default App
