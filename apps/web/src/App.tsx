import { ApiStatus } from './ApiStatus'

export function App() {
  return (
    <main>
      <h1>DICOM2FHIR Explorer</h1>
      <p>Drop a folder of DICOM files. Files never leave your browser.</p>
      <ApiStatus />
    </main>
  )
}
