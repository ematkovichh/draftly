import './Footer.css'

const donationUrl = (import.meta.env.VITE_DONATION_URL as string | undefined)?.trim()

export function Footer() {
  return (
    <footer className="footer">
      {donationUrl && (
        <a className="footer__support" href={donationUrl} target="_blank" rel="noreferrer">
          Support Draftly <span aria-hidden="true">↗</span>
        </a>
      )}
      <p>
        Draftly is a free, non-commercial community fan project. League of Legends and all champion assets are property of Riot Games. Draftly is not endorsed by Riot Games.
      </p>
    </footer>
  )
}
