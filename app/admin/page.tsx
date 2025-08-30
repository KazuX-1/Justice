"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Users, BarChart3, Trash2, ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface VoteEvent {
  id: string
  title: string
  description: string
  banner_image: string | null
  article_content: string | null
  options: string[]
  points_required: number
  is_active: boolean
  created_at: string
  ends_at: string | null
}

interface VoteStats {
  option_name: string
  vote_count: number
  total_points: number
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [voteEvents, setVoteEvents] = useState<VoteEvent[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [eventStats, setEventStats] = useState<Record<string, VoteStats[]>>({})

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    banner_image: "",
    article_content: "",
    options: ["", ""],
    points_required: 100,
    ends_at: "",
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("users").select("username").eq("id", user.id).single()

    if (!profile || !profile.username.startsWith("admin_")) {
      router.push("/dashboard")
      return
    }

    setIsAdmin(true)
    fetchVoteEvents()
    setLoading(false)
  }

  const fetchVoteEvents = async () => {
    const { data } = await supabase.from("vote_events").select("*").order("created_at", { ascending: false })

    if (data) {
      setVoteEvents(data)
      // Fetch stats for all events
      data.forEach((event) => fetchEventStats(event.id))
    }
  }

  const fetchEventStats = async (eventId: string) => {
    const { data } = await supabase.rpc("get_vote_statistics", { event_id: eventId })
    if (data) {
      setEventStats((prev) => ({ ...prev, [eventId]: data }))
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    try {
      const { error } = await supabase.from("vote_events").insert({
        title: formData.title,
        description: formData.description,
        banner_image: formData.banner_image || null,
        article_content: formData.article_content || null,
        options: formData.options.filter((option) => option.trim() !== ""),
        points_required: formData.points_required,
        ends_at: formData.ends_at || null,
        created_by: user.id,
        is_active: true,
      })

      if (error) throw error

      // Reset form
      setFormData({
        title: "",
        description: "",
        banner_image: "",
        article_content: "",
        options: ["", ""],
        points_required: 100,
        ends_at: "",
      })
      setShowCreateForm(false)
      fetchVoteEvents()
      alert("Vote event berhasil dibuat!")
    } catch (error) {
      console.error("Error creating event:", error)
      alert("Gagal membuat vote event")
    }
  }

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("vote_events").update({ is_active: !currentStatus }).eq("id", eventId)

      if (error) throw error

      fetchVoteEvents()
    } catch (error) {
      console.error("Error updating event status:", error)
      alert("Gagal mengubah status event")
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Yakin ingin menghapus vote event ini?")) return

    try {
      const { error } = await supabase.from("vote_events").delete().eq("id", eventId)

      if (error) throw error

      fetchVoteEvents()
      alert("Vote event berhasil dihapus!")
    } catch (error) {
      console.error("Error deleting event:", error)
      alert("Gagal menghapus vote event")
    }
  }

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }))
  }

  const updateOption = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }))
  }

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }))
    }
  }

  const getTotalVotes = (eventId: string) => {
    const stats = eventStats[eventId] || []
    return stats.reduce((total, stat) => total + Number(stat.vote_count), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-emerald-400 font-black text-2xl">LOADING...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-red-400 font-black text-2xl">ACCESS DENIED</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-emerald-400 uppercase tracking-wider mb-2">ADMIN PANEL</h1>
            <p className="text-zinc-300 font-bold">Kelola vote events dan statistik</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black uppercase border-2 border-emerald-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              BUAT EVENT
            </Button>
            <Link href="/admin/manage-donations">
              <Button
                variant="outline"
                className="border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-zinc-900 font-bold bg-transparent"
              >
                KELOLA DONASI
              </Button>
            </Link>
            <Link href="/admin/manage-admins">
              <Button
                variant="outline"
                className="border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-zinc-900 font-bold bg-transparent"
              >
                KELOLA ADMIN
              </Button>
            </Link>
            <Link href="/admin/promote-user">
              <Button
                variant="outline"
                className="border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-zinc-900 font-bold bg-transparent"
              >
                PROMOSIKAN USER
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-zinc-900 font-bold bg-transparent"
              >
                DASHBOARD
              </Button>
            </Link>
          </div>
        </div>

        {/* Create Event Form */}
        {showCreateForm && (
          <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)] mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-emerald-400 uppercase">BUAT VOTE EVENT BARU</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-zinc-100 font-bold uppercase">Judul Event</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-100 font-bold uppercase">Poin Required</Label>
                    <Input
                      type="number"
                      value={formData.points_required}
                      onChange={(e) => setFormData((prev) => ({ ...prev, points_required: Number(e.target.value) }))}
                      className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-100 font-bold uppercase flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Banner Image URL (Opsional)
                  </Label>
                  <Input
                    value={formData.banner_image}
                    onChange={(e) => setFormData((prev) => ({ ...prev, banner_image: e.target.value }))}
                    placeholder="https://example.com/banner.jpg atau /placeholder.svg?height=300&width=800&query=justice banner"
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                  />
                  {formData.banner_image && (
                    <div className="mt-2 p-2 border-2 border-zinc-600 bg-zinc-700 rounded">
                      <p className="text-zinc-300 text-sm font-bold mb-2">Preview Banner:</p>
                      <img
                        src={formData.banner_image || "/placeholder.svg"}
                        alt="Banner preview"
                        className="w-full h-32 object-cover border-2 border-emerald-400"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-100 font-bold uppercase">Deskripsi</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-100 font-bold uppercase">Artikel Lengkap (Opsional)</Label>
                  <Textarea
                    value={formData.article_content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, article_content: e.target.value }))}
                    placeholder="Tulis artikel lengkap tentang topik voting ini. Jelaskan latar belakang, dampak, dan mengapa citizen harus peduli..."
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                    rows={8}
                  />
                  <p className="text-zinc-400 text-sm">
                    Artikel ini akan ditampilkan di halaman detail vote untuk memberikan konteks lengkap kepada voters.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-zinc-100 font-bold uppercase">Opsi Voting</Label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Opsi ${index + 1}`}
                        className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                        required
                      />
                      {formData.options.length > 2 && (
                        <Button
                          type="button"
                          onClick={() => removeOption(index)}
                          variant="outline"
                          className="border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-zinc-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={addOption}
                    variant="outline"
                    className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-zinc-900 font-bold bg-transparent"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    TAMBAH OPSI
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-100 font-bold uppercase">Tanggal Berakhir (Opsional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ends_at: e.target.value }))}
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black uppercase border-2 border-emerald-600"
                  >
                    BUAT EVENT
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="border-2 border-zinc-400 text-zinc-400 hover:bg-zinc-400 hover:text-zinc-900 font-bold"
                  >
                    BATAL
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Vote Events List */}
        <div className="grid gap-6">
          {voteEvents.map((event) => {
            const stats = eventStats[event.id] || []
            const totalVotes = getTotalVotes(event.id)
            const isExpanded = selectedEvent === event.id

            return (
              <Card
                key={event.id}
                className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-black text-emerald-400 uppercase mb-2">
                        {event.title}
                      </CardTitle>
                      <p className="text-zinc-300 font-bold mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span>Dibuat: {new Date(event.created_at).toLocaleDateString("id-ID")}</span>
                        {event.ends_at && <span>Berakhir: {new Date(event.ends_at).toLocaleDateString("id-ID")}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`font-black ${event.is_active ? "bg-emerald-400 text-zinc-900" : "bg-red-400 text-zinc-900"}`}
                        >
                          {event.is_active ? "AKTIF" : "NONAKTIF"}
                        </Badge>
                        <Badge className="bg-orange-400 text-zinc-900 font-black">{event.points_required} POIN</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-400 font-bold">{totalVotes} votes</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={event.is_active}
                          onCheckedChange={() => toggleEventStatus(event.id, event.is_active)}
                        />
                        <span className="text-zinc-300 font-bold">Status Aktif</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedEvent(isExpanded ? null : event.id)}
                        variant="outline"
                        className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-zinc-900 font-bold"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        {isExpanded ? "TUTUP" : "STATISTIK"}
                      </Button>
                      <Button
                        onClick={() => deleteEvent(event.id)}
                        variant="outline"
                        className="border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-zinc-900 font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 border-t-2 border-zinc-600 pt-4">
                      <h4 className="text-lg font-black text-emerald-400 uppercase">HASIL VOTING</h4>
                      {stats.length === 0 ? (
                        <p className="text-zinc-400 font-bold">Belum ada vote untuk event ini.</p>
                      ) : (
                        <div className="space-y-3">
                          {stats.map((stat, index) => {
                            const percentage =
                              totalVotes > 0 ? Math.round((Number(stat.vote_count) / totalVotes) * 100) : 0

                            return (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-zinc-100">{stat.option_name}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-emerald-400 font-black">
                                      {stat.vote_count} votes ({percentage}%)
                                    </span>
                                    <span className="text-orange-400 font-black">{stat.total_points} poin</span>
                                  </div>
                                </div>
                                <div className="h-4 bg-zinc-700 border-2 border-zinc-600 overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-400 transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {voteEvents.length === 0 && (
          <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
            <CardContent className="p-8 text-center">
              <p className="text-zinc-300 font-bold text-xl">Belum ada vote event yang dibuat.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
