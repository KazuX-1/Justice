"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

interface DonationCause {
  id: number
  title: string
  description: string
  goal_amount: number
  current_amount: number
  is_active: boolean
  crypto_address: string
  created_at: string
}

export default function ManageDonationsPage() {
  const [causes, setCauses] = useState<DonationCause[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newCause, setNewCause] = useState({
    title: "",
    description: "",
    goal_amount: "",
    crypto_address: "0x552288268cdb748ee4164e981fb6b261631cd367",
  })
  const supabase = createClient()

  useEffect(() => {
    fetchCauses()
  }, [])

  const fetchCauses = async () => {
    const { data } = await supabase.from("donation_causes").select("*").order("created_at", { ascending: false })

    if (data) {
      setCauses(data)
    }
  }

  const createCause = async () => {
    if (!newCause.title || !newCause.description || !newCause.goal_amount) {
      alert("Semua field harus diisi!")
      return
    }

    const { error } = await supabase.from("donation_causes").insert([
      {
        title: newCause.title,
        description: newCause.description,
        goal_amount: Number.parseInt(newCause.goal_amount),
        current_amount: 0,
        is_active: true,
        crypto_address: newCause.crypto_address,
      },
    ])

    if (error) {
      alert("Error creating cause: " + error.message)
    } else {
      setNewCause({
        title: "",
        description: "",
        goal_amount: "",
        crypto_address: "0x552288268cdb748ee4164e981fb6b261631cd367",
      })
      setIsCreating(false)
      fetchCauses()
    }
  }

  const toggleCauseStatus = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.from("donation_causes").update({ is_active: !currentStatus }).eq("id", id)

    if (error) {
      alert("Error updating cause: " + error.message)
    } else {
      fetchCauses()
    }
  }

  const deleteCause = async (id: number) => {
    if (confirm("Yakin ingin menghapus cause ini?")) {
      const { error } = await supabase.from("donation_causes").delete().eq("id", id)

      if (error) {
        alert("Error deleting cause: " + error.message)
      } else {
        fetchCauses()
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button
                variant="outline"
                className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-zinc-900 font-bold bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                KEMBALI
              </Button>
            </Link>
            <h1 className="text-4xl font-black text-orange-400 uppercase tracking-wider">KELOLA DONASI</h1>
          </div>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-orange-400 hover:bg-orange-500 text-zinc-900 font-black uppercase"
          >
            <Plus className="w-4 h-4 mr-2" />
            BUAT CAUSE BARU
          </Button>
        </div>

        {/* Create New Cause Form */}
        {isCreating && (
          <Card className="border-4 border-orange-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.orange.400)] mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-black text-orange-400 uppercase">BUAT CAUSE DONASI BARU</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">JUDUL CAUSE</label>
                <Input
                  value={newCause.title}
                  onChange={(e) => setNewCause({ ...newCause, title: e.target.value })}
                  placeholder="Masukkan judul cause donasi"
                  className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">DESKRIPSI</label>
                <Textarea
                  value={newCause.description}
                  onChange={(e) => setNewCause({ ...newCause, description: e.target.value })}
                  placeholder="Deskripsi lengkap tentang cause ini"
                  className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">TARGET DONASI (IDR)</label>
                <Input
                  type="number"
                  value={newCause.goal_amount}
                  onChange={(e) => setNewCause({ ...newCause, goal_amount: e.target.value })}
                  placeholder="100000000"
                  className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">ETHEREUM ADDRESS</label>
                <Input
                  value={newCause.crypto_address}
                  onChange={(e) => setNewCause({ ...newCause, crypto_address: e.target.value })}
                  placeholder="0x552288268cdb748ee4164e981fb6b261631cd367"
                  className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100"
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={createCause}
                  className="bg-orange-400 hover:bg-orange-500 text-zinc-900 font-black uppercase"
                >
                  BUAT CAUSE
                </Button>
                <Button
                  onClick={() => setIsCreating(false)}
                  variant="outline"
                  className="border-2 border-zinc-600 text-zinc-300 hover:bg-zinc-600 font-bold bg-transparent"
                >
                  BATAL
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Causes */}
        <div className="space-y-6">
          {causes.map((cause) => {
            const progressPercentage = Math.min((cause.current_amount / cause.goal_amount) * 100, 100)

            return (
              <Card
                key={cause.id}
                className="border-4 border-orange-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.orange.400)]"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-black text-orange-400 uppercase mb-2">{cause.title}</CardTitle>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold border-2 ${
                            cause.is_active
                              ? "bg-green-400 text-zinc-900 border-green-400"
                              : "bg-red-400 text-zinc-900 border-red-400"
                          }`}
                        >
                          {cause.is_active ? "AKTIF" : "NONAKTIF"}
                        </span>
                        <span className="text-xs text-zinc-400">
                          Dibuat: {new Date(cause.created_at).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => toggleCauseStatus(cause.id, cause.is_active)}
                        size="sm"
                        className={`font-bold ${
                          cause.is_active
                            ? "bg-red-400 hover:bg-red-500 text-zinc-900"
                            : "bg-green-400 hover:bg-green-500 text-zinc-900"
                        }`}
                      >
                        {cause.is_active ? "NONAKTIFKAN" : "AKTIFKAN"}
                      </Button>
                      <Button
                        onClick={() => deleteCause(cause.id)}
                        size="sm"
                        variant="outline"
                        className="border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-zinc-900 font-bold bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-zinc-300">{cause.description}</p>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-zinc-100">
                        {formatCurrency(cause.current_amount)} terkumpul
                      </span>
                      <span className="text-sm font-bold text-zinc-400">
                        Target: {formatCurrency(cause.goal_amount)}
                      </span>
                    </div>
                    <div className="h-4 bg-zinc-700 border-2 border-zinc-600 overflow-hidden">
                      <div
                        className="h-full bg-orange-400 transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-bold text-orange-400">
                        {Math.round(progressPercentage)}% tercapai
                      </span>
                    </div>
                  </div>

                  {/* Crypto Address */}
                  <div className="bg-zinc-700 p-3 border-2 border-zinc-600">
                    <label className="block text-xs font-bold text-zinc-400 mb-1">ETHEREUM ADDRESS</label>
                    <code className="text-sm text-emerald-400 font-mono break-all">{cause.crypto_address}</code>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {causes.length === 0 && (
          <Card className="border-4 border-zinc-600 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.zinc.600)]">
            <CardContent className="text-center py-12">
              <p className="text-zinc-400 text-lg">Belum ada cause donasi yang dibuat</p>
              <p className="text-zinc-500 text-sm mt-2">Klik "BUAT CAUSE BARU" untuk memulai</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
