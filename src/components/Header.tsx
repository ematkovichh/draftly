import type { DatasetInfo } from '../core/types'
import './Header.css'

export function Header({ info }: { info?: DatasetInfo }) {
  return (
    <header className="header">
      <div className="header__brand">
        <svg className="header__hex" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l8 4.5v9L12 22l-8-6.5v-9L12 2z" stroke="#c8aa6e" strokeWidth="1.2"/>
          <path d="M12 7l4 2.4v4.8L12 17l-4-2.8V9.4L12 7z" stroke="#0ac8b9" strokeWidth="1"/>
        </svg>
        <div>
          <h1 className="header__title">DRAFTLY</h1>
          <p className="header__sub">Team Composition Forge</p>
        </div>
      </div>
      {info && (
        <div className="header__databar">
          <DataChip label="Patch" value={info.patch} />
          <DataChip label="Champions" value={String(info.championCount)} />
          <DataChip label="Data" value={info.championDataSource} />
          <DataChip label="Meta" value={info.metaSource ?? 'not connected'} dim={!info.metaSource} />
        </div>
      )}
    </header>
  )
}

function DataChip({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <span className="data-chip">
      <small>{label}</small>
      <em className={dim ? 'data-chip__val--dim' : ''}>{value}</em>
    </span>
  )
}
