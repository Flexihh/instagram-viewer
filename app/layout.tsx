import '../styles/globals.css'

export const metadata = {
  title: 'Instagram Viewer',
  description: 'Instagram Post Viewer und Analyse-Tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}