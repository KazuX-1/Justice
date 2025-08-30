import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LiveActivityFeed } from "@/components/live-activity-feed"
import { File as Fire, TrendingUp, Eye } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  // Check if user is admin
  const isAdmin = profile?.username?.startsWith("admin_") || false

  const { data: popularVotes } = await supabase
    .from("vote_events")
    .select("*")
    .eq("is_active", true)
    .order("interaction_score", { ascending: false })
    .limit(5)

  const { data: activeVotes } = await supabase
    .from("vote_events")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3)

  const { data: activeDonations } = await supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3)

  const handleLogout = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-emerald-400 uppercase tracking-wider">DASHBOARD</h1>
          <form action={handleLogout}>
            <Button
              type="submit"
              variant="outline"
              className="border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-zinc-900 font-bold bg-transparent"
            >
              KELUAR
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info & Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Profile Card */}
              <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-emerald-400 uppercase">PROFIL ANDA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-zinc-100 font-bold">
                    <span className="text-emerald-400">Username:</span> {profile?.username || "Loading..."}
                  </p>
                  <p className="text-zinc-100 font-bold">
                    <span className="text-emerald-400">Lokasi:</span> {profile?.kota}, {profile?.provinsi}
                  </p>
                  <p className="text-zinc-100 font-bold">
                    <span className="text-emerald-400">Umur:</span> {profile?.umur} tahun
                  </p>
                  <p className="text-zinc-100 font-bold">
                    <span className="text-emerald-400">Poin:</span> {profile?.points || 0}
                  </p>
                  {isAdmin && <p className="text-orange-400 font-black uppercase">ADMIN ACCESS</p>}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-emerald-400 uppercase">AKSI CEPAT</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/vote">
                    <Button className="w-full bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black uppercase">
                      VOTING
                    </Button>
                  </Link>
                  <Link href="/donate">
                    <Button className="w-full bg-orange-400 hover:bg-orange-500 text-zinc-900 font-black uppercase">
                      DONASI
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin">
                      <Button className="w-full bg-red-400 hover:bg-red-500 text-zinc-900 font-black uppercase">
                        ADMIN PANEL
                      </Button>
                    </Link>
                  )}
                  <Link href="/">
                    <Button className="w-full bg-zinc-600 hover:bg-zinc-500 text-zinc-100 font-black uppercase">
                      BERANDA
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Card className="border-4 border-red-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.red.400)]">
              <CardHeader>
                <CardTitle className="text-xl font-black text-red-400 uppercase flex items-center gap-2">
                  <Fire className="w-5 h-5" />
                  VOTING POPULER
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {popularVotes && popularVotes.length > 0 ? (
                  <div className="space-y-3">
                    {popularVotes.map((vote, index) => (
                      <div key={vote.id} className="border-2 border-zinc-600 p-3 bg-zinc-700 relative">
                        {index === 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-red-400 text-zinc-900 font-black text-xs">
                            #1 HOT
                          </Badge>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-zinc-100 flex-1 pr-2">{vote.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {vote.view_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {vote.interaction_score}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-300 mb-2 line-clamp-2">{vote.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400 font-bold">Poin: {vote.points_required}</span>
                            {vote.banner_image && (
                              <Badge className="bg-blue-400 text-zinc-900 font-bold text-xs">IMG</Badge>
                            )}
                          </div>
                          <Link href={`/vote/${vote.id}`}>
                            <Button size="sm" className="bg-red-400 hover:bg-red-500 text-zinc-900 font-bold">
                              LIHAT
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Link href="/vote">
                        <Button
                          variant="outline"
                          className="border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-zinc-900 font-bold bg-transparent"
                        >
                          LIHAT SEMUA POPULER
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400">Belum ada voting populer saat ini</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
              <CardHeader>
                <CardTitle className="text-xl font-black text-emerald-400 uppercase flex items-center gap-2">
                  VOTING AKTIF
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeVotes && activeVotes.length > 0 ? (
                  <div className="space-y-3">
                    {activeVotes.map((vote) => (
                      <div key={vote.id} className="border-2 border-zinc-600 p-3 bg-zinc-700">
                        <h4 className="font-bold text-zinc-100 mb-1">{vote.title}</h4>
                        <p className="text-sm text-zinc-300 mb-2">{vote.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-emerald-400 font-bold">Poin: {vote.points_required}</span>
                          <Link href={`/vote/${vote.id}`}>
                            <Button size="sm" className="bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-bold">
                              VOTE
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400">Tidak ada voting aktif saat ini</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-4 border-orange-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.orange.400)]">
              <CardHeader>
                <CardTitle className="text-xl font-black text-orange-400 uppercase flex items-center gap-2">
                  DONASI TERBARU
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeDonations && activeDonations.length > 0 ? (
                  <div className="space-y-3">
                    {activeDonations.map((donation) => (
                      <div key={donation.id} className="border-2 border-zinc-600 p-3 bg-zinc-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-zinc-100">{donation.donor_name || "Anonymous"}</h4>
                            <p className="text-sm text-zinc-300">{donation.cause}</p>
                          </div>
                          <span className="text-orange-400 font-bold">
                            Rp {Number(donation.amount).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400">Belum ada donasi terbaru</p>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
              <CardHeader>
                <CardTitle className="text-xl font-black text-emerald-400 uppercase">STATISTIK</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-400">0</p>
                  <p className="text-sm font-bold text-zinc-300">Total Vote</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-400">0</p>
                  <p className="text-sm font-bold text-zinc-300">Poin Terpakai</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-400">Rp 0</p>
                  <p className="text-sm font-bold text-zinc-300">Donasi</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Live Activity Feed */}
          <div>
            <LiveActivityFeed />
          </div>
        </div>
      </div>
    </div>
  )
}
