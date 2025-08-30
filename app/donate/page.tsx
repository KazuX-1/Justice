"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Heart, Shield, Users, ArrowLeft, Copy, Wallet } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

const ETHEREUM_ADDRESS = "0x552288268cdb748ee4164e981fb6b261631cd367"
const TRAKTEER_URL = "https://trakteer.id/justiceexcist/tip"

const quickAmounts = [50000, 100000, 250000, 500000, 1000000, 2500000]

export default function DonatePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [recentDonations, setRecentDonations] = useState<any[]>([])
  const [activeCauses, setActiveCauses] = useState<any[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"traditional" | "crypto">("traditional")
  const [addressCopied, setAddressCopied] = useState(false)

  const [formData, setFormData] = useState({
    amount: "",
    cause: "general",
    message: "",
    donor_name: "",
    is_anonymous: false,
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchRecentDonations()
    fetchActiveCauses()

    const causeParam = searchParams.get("cause")
    if (causeParam) {
      setFormData((prev) => ({ ...prev, cause: causeParam }))
    }
  }, [searchParams])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: profile } = await supabase.from("users").select("username").eq("id", user.id).single()
      if (profile) {
        setFormData((prev) => ({ ...prev, donor_name: profile.username }))
      }
    }
    setLoading(false)
  }

  const fetchRecentDonations = async () => {
    const { data } = await supabase
      .from("donations")
      .select("*")
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false })
      .limit(10)

    if (data) {
      setRecentDonations(data)
    }
  }

  const fetchActiveCauses = async () => {
    const { data } = await supabase
      .from("donation_causes")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (data && data.length > 0) {
      setActiveCauses(data)
    } else {
      setActiveCauses([
        {
          id: "general",
          title: "General Justice Fund",
          description: "Supporting all justice initiatives",
          target_amount: 10000000,
        },
      ])
    }
  }

  const handleAmountSelect = (amount: number) => {
    setFormData((prev) => ({ ...prev, amount: amount.toString() }))
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(ETHEREUM_ADDRESS)
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy address:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const amount = Number.parseFloat(formData.amount)
      if (amount < 10000) {
        alert("Minimum donation adalah Rp 10.000")
        return
      }

      if (paymentMethod === "traditional") {
        window.open(TRAKTEER_URL, "_blank")
        alert(
          `Anda akan diarahkan ke Trakteer untuk pembayaran IDR.\n\nCATATAN PENTING:\n• Tuliskan nama di form pesan dukungan\n• Jika ingin anonim, kosongkan nama\n• Untuk crypto, gunakan alamat Ethereum yang disediakan atau scan QR code`,
        )
        setSubmitting(false)
        return
      }

      const selectedCause = activeCauses.find((c) => c.id === formData.cause)

      const donationData = {
        donor_id: user?.id || null,
        donor_name: formData.is_anonymous ? null : formData.donor_name || "Anonymous",
        amount: amount,
        message: formData.message || null,
        cause: selectedCause?.title || "General Justice Fund",
        is_anonymous: formData.is_anonymous,
        payment_method: paymentMethod,
        crypto_address: paymentMethod === "crypto" ? ETHEREUM_ADDRESS : null,
      }

      const { error } = await supabase.from("donations").insert(donationData)

      if (error) throw error

      if (paymentMethod === "crypto") {
        alert(
          "Terima kasih! Silakan transfer crypto ke alamat yang disediakan atau scan QR code. Donasi akan diverifikasi setelah transaksi dikonfirmasi.",
        )
      }

      setFormData({
        amount: "",
        cause: "general",
        message: "",
        donor_name: user ? formData.donor_name : "",
        is_anonymous: false,
      })

      fetchRecentDonations()
    } catch (error) {
      console.error("Error submitting donation:", error)
      alert("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-emerald-400 font-black text-2xl">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button
              variant="outline"
              className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-zinc-900 font-bold bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              KEMBALI
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black text-emerald-400 uppercase tracking-wider mb-2">DONASI</h1>
            <p className="text-zinc-300 font-bold">Dukung perjuangan keadilan di Indonesia</p>
          </div>
        </div>

        <Card className="border-4 border-yellow-400 bg-yellow-400/10 mb-8">
          <CardContent className="p-6">
            <div className="text-yellow-400 font-black text-lg mb-3 uppercase">📋 PETUNJUK DONASI</div>
            <div className="text-zinc-100 space-y-2">
              <p>
                <strong>Untuk pembayaran IDR:</strong> Akan diarahkan ke Trakteer.id
              </p>
              <p>
                <strong>Untuk pembayaran Crypto:</strong> Transfer ke alamat Ethereum atau scan QR code
              </p>
              <p>
                <strong>Catatan:</strong> Tuliskan nama di form pesan dukungan, jika ingin anonim kosongkan
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-emerald-400 uppercase flex items-center gap-3">
                  <Heart className="w-6 h-6" />
                  FORM DONASI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-zinc-100 font-bold uppercase">Metode Pembayaran</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={paymentMethod === "traditional" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("traditional")}
                        className={`font-bold ${
                          paymentMethod === "traditional"
                            ? "bg-emerald-400 text-zinc-900 border-2 border-emerald-600"
                            : "border-2 border-zinc-600 text-zinc-100 hover:bg-emerald-400 hover:text-zinc-900"
                        }`}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        TRADISIONAL
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMethod === "crypto" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("crypto")}
                        className={`font-bold ${
                          paymentMethod === "crypto"
                            ? "bg-orange-400 text-zinc-900 border-2 border-orange-600"
                            : "border-2 border-zinc-600 text-zinc-100 hover:bg-orange-400 hover:text-zinc-900"
                        }`}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        CRYPTO
                      </Button>
                    </div>
                  </div>

                  {paymentMethod === "crypto" && (
                    <Card className="border-2 border-orange-400 bg-orange-400/10">
                      <CardHeader>
                        <CardTitle className="text-lg font-black text-orange-400 uppercase">
                          ETHEREUM ADDRESS & QR CODE
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-zinc-700 p-4 border-2 border-zinc-600 break-all">
                          <code className="text-emerald-400 font-mono text-sm">{ETHEREUM_ADDRESS}</code>
                        </div>
                        <div className="flex justify-center">
                          <img
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-zgxqSYKkV6nnH3kQWDAkEJiUZHbTdC.png"
                            alt="Ethereum QR Code"
                            className="w-48 h-48 border-2 border-orange-400"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={copyAddress}
                          className={`w-full font-bold ${
                            addressCopied
                              ? "bg-green-400 text-zinc-900"
                              : "bg-orange-400 hover:bg-orange-500 text-zinc-900"
                          }`}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {addressCopied ? "ALAMAT DISALIN!" : "SALIN ALAMAT"}
                        </Button>
                        <div className="text-sm text-zinc-300 space-y-1">
                          <p>• Transfer ETH atau token ERC-20 ke alamat di atas</p>
                          <p>• Atau scan QR code dengan wallet Ethereum Anda</p>
                          <p>• Donasi akan diverifikasi dalam 24 jam</p>
                          <p>• Simpan bukti transaksi untuk referensi</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-3">
                    <Label className="text-zinc-100 font-bold uppercase">Pilih Jumlah</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {quickAmounts.map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant={formData.amount === amount.toString() ? "default" : "outline"}
                          onClick={() => handleAmountSelect(amount)}
                          className={`font-bold text-sm ${
                            formData.amount === amount.toString()
                              ? "bg-emerald-400 text-zinc-900 border-2 border-emerald-600"
                              : "border-2 border-zinc-600 text-zinc-100 hover:bg-emerald-400 hover:text-zinc-900"
                          }`}
                        >
                          {formatCurrency(amount)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-100 font-bold uppercase">Atau Masukkan Jumlah Lain</Label>
                    <Input
                      type="number"
                      placeholder="Minimum Rp 10.000"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                      min="10000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-100 font-bold uppercase">Pilih Tujuan Donasi (Hanya Aktif)</Label>
                    <div className="space-y-2">
                      {activeCauses.map((cause) => (
                        <div
                          key={cause.id}
                          className={`p-3 border-2 cursor-pointer transition-all ${
                            formData.cause === cause.id
                              ? "border-emerald-400 bg-emerald-400/10"
                              : "border-zinc-600 hover:border-emerald-400"
                          }`}
                          onClick={() => setFormData((prev) => ({ ...prev, cause: cause.id }))}
                        >
                          <div className="font-bold text-zinc-100">{cause.title}</div>
                          <div className="text-sm text-zinc-400">{cause.description}</div>
                          {cause.target_amount && (
                            <div className="text-xs text-emerald-400 mt-1">
                              Target: {formatCurrency(cause.target_amount)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {!user && (
                    <div className="space-y-2">
                      <Label className="text-zinc-100 font-bold uppercase">Nama Donatur (Opsional)</Label>
                      <Input
                        value={formData.donor_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, donor_name: e.target.value }))}
                        placeholder="Nama Anda"
                        className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-zinc-100 font-bold uppercase">Pesan (Opsional)</Label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="Pesan dukungan Anda..."
                      className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={formData.is_anonymous}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_anonymous: checked }))}
                    />
                    <Label className="text-zinc-100 font-bold">Donasi Anonim</Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className={`w-full font-black text-lg uppercase tracking-wider h-14 border-2 transition-all ${
                      paymentMethod === "crypto"
                        ? "bg-orange-400 hover:bg-orange-500 text-zinc-900 border-orange-600 shadow-[4px_4px_0px_0px_theme(colors.orange.600)] hover:shadow-[2px_2px_0px_0px_theme(colors.orange.600)]"
                        : "bg-emerald-400 hover:bg-emerald-500 text-zinc-900 border-emerald-600 shadow-[4px_4px_0px_0px_theme(colors.emerald.600)] hover:shadow-[2px_2px_0px_0px_theme(colors.emerald.600)]"
                    } hover:translate-x-[2px] hover:translate-y-[2px]`}
                  >
                    {submitting
                      ? "MEMPROSES..."
                      : paymentMethod === "crypto"
                        ? "KONFIRMASI CRYPTO DONASI"
                        : "DONASI SEKARANG"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
              <CardHeader>
                <CardTitle className="text-xl font-black text-emerald-400 uppercase flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  KEAMANAN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>100% donasi langsung ke tujuan</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Laporan transparansi bulanan</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Proses pembayaran aman</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Donasi crypto didukung via Ethereum</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Update dampak reguler</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
              <CardHeader>
                <CardTitle className="text-xl font-black text-emerald-400 uppercase flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  DONASI TERBARU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDonations.slice(0, 5).map((donation, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-zinc-600">
                      <div>
                        <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                          {donation.donor_name || "Anonymous"}
                          {donation.payment_method === "crypto" && (
                            <Badge className="bg-orange-400 text-zinc-900 text-xs">CRYPTO</Badge>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {donation.cause} • {new Date(donation.created_at).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                      <Badge className="bg-emerald-400 text-zinc-900 font-black">
                        {formatCurrency(donation.amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
