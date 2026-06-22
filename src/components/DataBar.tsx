import type { DatasetInfo } from '../core/types'
import './DataBar.css'

export function DataBar({ info }: { info: DatasetInfo }) {
  return (
    <div className="databar">
      <span className="databar__item">
        <small>Patch</small> {info.patch}
      </span>
      <span className="databar__dot" />
      <span className="databar__item">
        <small>Champions</small> {info.championCount}
      </span>
      <span className="databar__dot" />
      <span className="databar__item">
        <small>Data</small> {info.championDataSource}
      </span>
      <span className="databar__dot" />
      <span className="databar__item">
        <small>Meta</small>
        <span className={info.metaSource ? 'databar__on' : 'databar__off'}>
          {info.metaSource ?? 'not connected'}
        </span>
      </span>
    </div>
  )
}
