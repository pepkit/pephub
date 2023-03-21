import { useState } from "react"
import { PageLayout } from "../components/layout/page-layout"

function Home() {
  const [namespace, setNamespace] = useState<string>('')
  return (
    <PageLayout>
      Welcome to PEPhub. This is a demo react app. Please try to navigate to an example namespace page.
      <div className="mt-3 d-flex flex-row align-items-center">
        <input type="text" className="form-control w-25" id="namespace" value={namespace} onChange={(e) => setNamespace(e.target.value)} />
        <a href={`/${namespace}`}>
          <button className="btn btn-primary">Send me</button>
        </a>
      </div>
    </PageLayout>
  )
}

export default Home
