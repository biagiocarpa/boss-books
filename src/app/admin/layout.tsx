export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black">
      <header className="flex items-center justify-between border-b border-black/20 p-4">
        <a href="/admin" className="font-semibold">boss-books · Admin</a>
        <nav className="flex gap-4 text-sm">
          <a href="/admin">Clienti</a>
          <a href="/admin/impostazioni">Impostazioni</a>
          <form action="/admin/logout" method="post"><button type="submit">Esci</button></form>
        </nav>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
