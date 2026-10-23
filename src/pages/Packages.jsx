import { useFetch } from '../hooks'
import { PackageCard } from '../components/Cards'
import { ErrorBox, Spinner } from '../components/ui'

export default function Packages() {
  const { data, error, loading } = useFetch('/packages')
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">Home / Health packages</div>
          <h1>Health check-up packages</h1>
          <p>Several tests from a single sample, priced lower than booking each test separately.</p>
        </div>
      </div>
      <section className="section-sm">
        <div className="container">
          <ErrorBox error={error} />
          {loading ? <Spinner /> : (
            <div className="grid grid-3">
              {(data || []).map((p, i) => <PackageCard key={p.id} pkg={p} featured={i === 1} />)}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
