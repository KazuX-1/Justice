"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Clock, Coins, TrendingUp, Eye, File as Fire } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface VoteEvent {
  id: string
  title: string
  description: string
  banner_image: string | null
  options: string[]
  points_required: number
  is_active: boolean
  created_at: string
  ends_at: string | null
  view_count: number
  interaction_score: number
}

interface VoteStats {
  option_name: string
  vote_count: number
  total_points: number
}

interface UserProfile {
  id: string
  username: string
  points: number
}

export default function VotePage() {
  const [allVoteEvents, setAllVoteEvents] = useState<VoteEvent[]>([])
  const [popularVoteEvents, setPopularVoteEvents] = useState<VoteEvent[]>([])
  const [voteStats, setVoteStats] = useState<Record<string, VoteStats[]>>({})
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [votingLoading, setVotingLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchVoteEvents()

    // Set up real-time subscription for vote updates
    const channel = supabase
      .channel("vote-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes" }, () => {
        fetchVoteStats()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vote_interactions" }, () => {
        fetchVoteEvents()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

    setUserProfile(profile)

    // Get user's existing votes
    const { data: votes } = await supabase.from("votes").select("vote_event_id, option_selected").eq("user_id", user.id)

    if (votes) {
      const voteMap = votes.reduce(
        (acc, vote) => {
          acc[vote.vote_event_id] = vote.option_selected
          return acc
        },
        {} as Record<string, string>,
      )
      setUserVotes(voteMap)
    }
  }

  const fetchVoteEvents = async () => {
    // Fetch all active vote events
    const { data: allEvents, error } = await supabase
      .from("vote_events")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (allEvents) {
      setAllVoteEvents(allEvents)
      fetchVoteStats(allEvents)
    }

    // Fetch popular vote events (sorted by interaction score)
    const { data: popularEvents } = await supabase
      .from("vote_events")
      .select("*")
      .eq("is_active", true)
      .order("interaction_score", { ascending: false })
      .limit(10)

    if (popularEvents) {
      setPopularVoteEvents(popularEvents)
    }

    setLoading(false)
  }

  const fetchVoteStats = async (events?: VoteEvent[]) => {
    const eventsToFetch = events || allVoteEvents
    const statsPromises = eventsToFetch.map(async (event) => {
      const { data } = await supabase.rpc("get_vote_statistics", { event_id: event.id })
      return { eventId: event.id, stats: data || [] }
    })

    const results = await Promise.all(statsPromises)
    const statsMap = results.reduce(
      (acc, { eventId, stats }) => {
        acc[eventId] = stats
        return acc
      },
      {} as Record<string, VoteStats[]>,
    )

    setVoteStats(statsMap)
  }

  const handleVote = async (eventId: string, option: string, pointsRequired: number) => {
    if (!userProfile) return

    if (userProfile.points < pointsRequired) {
      alert("Poin Anda tidak cukup untuk voting!")
      return
    }

    setVotingLoading(eventId)

    try {
      const { error } = await supabase.rpc("cast_vote", {
        p_vote_event_id: eventId,
        p_user_id: userProfile.id,
        p_option_selected: option,
        p_points_used: pointsRequired,
      })

      if (error) throw error

      // Track vote interaction
      await supabase.from("vote_interactions").upsert({
        vote_event_id: eventId,
        user_id: userProfile.id,
        interaction_type: "vote",
      })

      // Update local state
      setUserVotes((prev) => ({ ...prev, [eventId]: option }))
      setUserProfile((prev) => (prev ? { ...prev, points: prev.points - pointsRequired } : null))

      // Refresh stats and events
      fetchVoteStats()
      fetchVoteEvents()

      alert("Vote berhasil!")
    } catch (error) {
      console.error("Error voting:", error)
      alert("Gagal melakukan vote. Silakan coba lagi.")
    } finally {
      setVotingLoading(null)
    }
  }

  const getTotalVotes = (eventId: string) => {
    const stats = voteStats[eventId] || []
    return stats.reduce((total, stat) => total + Number(stat.vote_count), 0)
  }

  const getOptionPercentage = (eventId: string, option: string) => {
    const stats = voteStats[eventId] || []
    const totalVotes = getTotalVotes(eventId)
    const optionStat = stats.find((stat) => stat.option_name === option)

    if (!optionStat || totalVotes === 0) return 0
    return Math.round((Number(optionStat.vote_count) / totalVotes) * 100)
  }

  const getOptionVotes = (eventId: string, option: string) => {
    const stats = voteStats[eventId] || []
    const optionStat = stats.find((stat) => stat.option_name === option)
    return optionStat ? Number(optionStat.vote_count) : 0
  }

  const getTopOption = (eventId: string) => {
    const stats = voteStats[eventId] || []
    if (stats.length === 0) return null
    return stats.reduce((top, current) => (Number(current.vote_count) > Number(top.vote_count) ? current : top))
  }

  const renderVoteCard = (event: VoteEvent, showPopularityBadge = false) => {
    const totalVotes = getTotalVotes(event.id)
    const hasVoted = userVotes[event.id]
    const topOption = getTopOption(event.id)

    return (
      <Card
        key={event.id}
        className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]"
      >
        {event.banner_image && (
          <div className="border-b-4 border-emerald-400">
            <img
              src={event.banner_image || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl font-black text-emerald-400 uppercase">{event.title}</CardTitle>
                {showPopularityBadge && (
                  <Badge className="bg-red-400 text-zinc-900 font-black flex items-center gap-1">
                    <Fire className="w-3 h-3" />
                    HOT
                  </Badge>
                )}
              </div>
              <p className="text-zinc-300 font-bold mb-4">{event.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-emerald-400 text-zinc-900 font-black">{event.points_required} POIN</Badge>
              {hasVoted && <Badge className="bg-orange-400 text-zinc-900 font-black">SUDAH VOTE</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {totalVotes} votes
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {event.view_count} views
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {event.interaction_score} score
            </div>
            {event.ends_at && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Berakhir: {new Date(event.ends_at).toLocaleDateString("id-ID")}
              </div>
            )}
          </div>

          {topOption && totalVotes > 0 && (
            <div className="mt-4 p-3 border-2 border-emerald-400 bg-emerald-400/10 rounded">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-400">Leading: {topOption.option_name}</span>
                <Badge className="bg-emerald-400 text-zinc-900 font-black">
                  {Math.round((Number(topOption.vote_count) / totalVotes) * 100)}%
                </Badge>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {event.options.slice(0, 2).map((option, index) => {
              const percentage = getOptionPercentage(event.id, option)
              const votes = getOptionVotes(event.id, option)
              const isSelected = hasVoted === option

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${isSelected ? "text-emerald-400" : "text-zinc-100"}`}>
                      {option} {isSelected && "✓"}
                    </span>
                    <span className="text-emerald-400 font-black">
                      {percentage}% ({votes})
                    </span>
                  </div>

                  <div className="h-3 bg-zinc-700 border-2 border-zinc-600 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isSelected ? "bg-emerald-400" : "bg-emerald-600"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {event.options.length > 2 && (
              <p className="text-zinc-400 text-sm font-bold">+{event.options.length - 2} more options</p>
            )}

            <div className="flex gap-2 pt-2">
              <Link href={`/vote/${event.id}`} className="flex-1">
                <Button className="w-full bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black uppercase border-2 border-emerald-600">
                  VIEW DETAILS
                </Button>
              </Link>
              {!hasVoted && (
                <Button
                  onClick={() => router.push(`/vote/${event.id}`)}
                  variant="outline"
                  className="border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-zinc-900 font-bold bg-transparent"
                >
                  QUICK VOTE
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-emerald-400 uppercase tracking-wider mb-2">VOTING SYSTEM</h1>
            <p className="text-zinc-300 font-bold">Suarakan pendapat Anda untuk Indonesia yang lebih baik</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-black text-xl">{userProfile?.points || 0} POIN</span>
            </div>
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

        {/* Tabs for Popular vs All Votes */}
        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800 border-4 border-emerald-400 mb-8">
            <TabsTrigger
              value="popular"
              className="data-[state=active]:bg-emerald-400 data-[state=active]:text-zinc-900 font-black uppercase"
            >
              <Fire className="w-4 h-4 mr-2" />
              POPULAR VOTES
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-emerald-400 data-[state=active]:text-zinc-900 font-black uppercase"
            >
              <Clock className="w-4 h-4 mr-2" />
              ALL VOTES
            </TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="space-y-8">
            {popularVoteEvents.length === 0 ? (
              <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
                <CardContent className="p-8 text-center">
                  <Fire className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-300 font-bold text-xl">Belum ada voting populer saat ini.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8">{popularVoteEvents.map((event) => renderVoteCard(event, true))}</div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-8">
            {allVoteEvents.length === 0 ? (
              <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
                <CardContent className="p-8 text-center">
                  <p className="text-zinc-300 font-bold text-xl">Belum ada voting yang aktif saat ini.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8">{allVoteEvents.map((event) => renderVoteCard(event))}</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
