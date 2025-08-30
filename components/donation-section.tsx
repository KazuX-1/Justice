"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, Users, Shield, Target, ArrowRight } from "lucide-react"

const causes = [
  {
    id: 1,
    title: "Dukung keberlangsungan platform ini agar terus berkembang.",
    description: "Donasi Anda membantu kami menjaga platform ini tetap gratis untuk semua.” “Donasi akan digunakan untuk biaya server, pengembangan fitur, dan keamanan data.” Transparansi penggunaan 60% → biaya server & domain 30% → pengembangan fitur baru 10% → desain & konten “Dengan donasi, Anda ikut menjaga ruang suara rakyat ini tetap hidup.” “Kami tidak menjual data, karena itu kami mengandalkan dukungan sukarela.” Platform ini hadir untuk menyediakan ruang bagi masyarakat menyuarakan pendapat dan memperjuangkan keadilan. Kami ingin tetap bebas dari iklan berlebihan dan tidak menjual data pengguna. Jika Anda ingin mendukung keberlanjutan dan perkembangan web ini, Anda bisa memberikan donasi sukarela. Setiap dukungan, sekecil apapun, sangat berarti. 🙏",
    raised: 50000,
    goal: 100000000,
    supporters: 1,
    urgent: true,
  },
]

export function DonationSection() {
  const [recentDonations, setRecentDonations] = useState<any[]>([])
  const [totalRaised, setTotalRaised] = useState(0)
  const [totalDonors, setTotalDonors] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    fetchRecentDonations()
    fetchDonationStats()

    // Set up real-time subscription for new donations
    const channel = supabase
      .channel("donation-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "donations" }, (payload) => {
        console.log("[v0] New donation received:", payload.new)
        fetchRecentDonations()
        fetchDonationStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRecentDonations = async () => {
    const { data } = await supabase
      .from("donations")
      .select("*")
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false })
      .limit(4)

    if (data) {
      setRecentDonations(data)
    }
  }

  const fetchDonationStats = async () => {
    // Get total raised
    const { data: totalData } = await supabase.from("donations").select("amount")

    if (totalData) {
      const total = totalData.reduce((sum, donation) => sum + Number(donation.amount), 0)
      setTotalRaised(total)
      setTotalDonors(totalData.length)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100)
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Baru saja"
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`
    return `${Math.floor(diffInMinutes / 1440)} hari lalu`
  }

  return (
    <section className="py-20 bg-background border-b-8 border-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <Heart className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-black text-foreground">SUPPORT THE FIGHT</h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Donate to support activists, community initiatives, and justice fighters across Indonesia
          </p>
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-black text-primary">{formatCurrency(totalRaised)}</div>
              <div className="text-sm font-bold text-muted-foreground">TOTAL TERKUMPUL</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary">{totalDonors}</div>
              <div className="text-sm font-bold text-muted-foreground">DONATUR</div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Donation Causes */}
            <div className="lg:col-span-2 space-y-6">
              {causes.map((cause) => {
                const progressPercentage = getProgressPercentage(cause.raised, cause.goal)

                return (
                  <Card
                    key={cause.id}
                    className="p-6 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-card hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black text-foreground text-balance">{cause.title}</h3>
                          {cause.urgent && (
                            <span className="px-2 py-1 text-xs font-bold bg-destructive text-destructive-foreground border-2 border-secondary">
                              URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-4 text-pretty">{cause.description}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(cause.raised)} raised</span>
                        <span className="text-sm font-bold text-muted-foreground">
                          Goal: {formatCurrency(cause.goal)}
                        </span>
                      </div>
                      <div className="h-4 bg-muted border-2 border-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-bold text-primary">{Math.round(progressPercentage)}% funded</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {cause.supporters} supporters
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        asChild
                        className="flex-1 border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px] shadow-secondary transition-all duration-200 font-bold"
                      >
                        <a href={`/donate?cause=${cause.id}`}>DONATE NOW</a>
                      </Button>
                      <Button
                        variant="outline"
                        className="border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px] shadow-secondary transition-all duration-200 font-bold bg-background"
                      >
                        LEARN MORE
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Donate */}
              <Card className="p-6 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-primary/10">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-black text-foreground">QUICK DONATE</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Make an immediate impact with a one-time donation to our general justice fund
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[50000, 100000, 250000, 500000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      className="border-2 border-secondary hover:bg-primary hover:text-primary-foreground font-bold text-sm bg-transparent"
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black border-2 border-secondary"
                >
                  <a href="/donate">CUSTOM AMOUNT</a>
                </Button>
              </Card>

              {/* Recent Donations - Now Real-time */}
              <Card className="p-6 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-black text-foreground">LIVE DONATIONS</h3>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  {recentDonations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada donasi terbaru</p>
                  ) : (
                    recentDonations.map((donation, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-secondary/20">
                        <div>
                          <div className="font-bold text-sm text-foreground">{donation.donor_name || "Anonymous"}</div>
                          <div className="text-xs text-muted-foreground">
                            {donation.cause} • {formatTimeAgo(donation.created_at)}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-primary">{formatCurrency(donation.amount)}</div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Trust & Security */}
              <Card className="p-6 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-accent/10">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-black text-foreground">SECURE & TRANSPARENT</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>100% of donations go directly to causes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>Monthly transparency reports published</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>Secure payment processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>Regular impact updates to donors</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <Card className="p-8 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-primary/5 max-w-3xl mx-auto">
              <h3 className="text-3xl font-black text-foreground mb-4">EVERY RUPIAH COUNTS</h3>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Your donation directly supports legal aid, investigative journalism, community organizing, and advocacy
                work that creates real change in Indonesia
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px] shadow-secondary transition-all duration-200 font-bold"
                >
                  <a href="/donate">
                    START DONATING
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px] shadow-secondary transition-all duration-200 font-bold bg-background"
                >
                  VIEW IMPACT REPORT
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
