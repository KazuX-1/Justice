"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Vote, Users, Eye, Clock } from "lucide-react"
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

export function VotingSystem() {
  const [voteEvents, setVoteEvents] = useState<VoteEvent[]>([])
  const [eventStats, setEventStats] = useState<Record<string, VoteStats[]>>({})
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchActiveVoteEvents()
  }, [])

  const fetchActiveVoteEvents = async () => {
    try {
      // Fetch active vote events
      const { data: events } = await supabase
        .from("vote_events")
        .select("*")
        .eq("is_active", true)
        .order("interaction_score", { ascending: false })
        .limit(4)

      if (events) {
        setVoteEvents(events)
        // Fetch stats for each event
        events.forEach((event) => fetchEventStats(event.id))
      }
    } catch (error) {
      console.error("Error fetching vote events:", error)
      // Fallback to mock data if database isn't set up
      setVoteEvents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEventStats = async (eventId: string) => {
    try {
      const { data } = await supabase.rpc("get_vote_statistics", { event_id: eventId })
      if (data) {
        setEventStats((prev) => ({ ...prev, [eventId]: data }))
      }
    } catch (error) {
      console.error("Error fetching event stats:", error)
    }
  }

  const getTotalVotes = (eventId: string) => {
    const stats = eventStats[eventId] || []
    return stats.reduce((total, stat) => total + Number(stat.vote_count), 0)
  }

  const getTopOption = (eventId: string) => {
    const stats = eventStats[eventId] || []
    if (stats.length === 0) return null
    return stats.reduce((top, current) => (Number(current.vote_count) > Number(top.vote_count) ? current : top))
  }

  const getTimeLeft = (endsAt: string | null) => {
    if (!endsAt) return "No deadline"
    const now = new Date()
    const end = new Date(endsAt)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days} days left`

    const hours = Math.floor(diff / (1000 * 60 * 60))
    return `${hours} hours left`
  }

  if (loading) {
    return (
      <section className="py-20 bg-card border-b-8 border-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-black text-primary">LOADING VOTES...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-card border-b-8 border-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <Vote className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-black text-foreground">PUBLIC VOTING</h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Make your voice heard on critical national issues affecting Indonesia's future
          </p>
        </div>

        {voteEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground font-bold">No active votes available. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {voteEvents.map((event) => {
              const totalVotes = getTotalVotes(event.id)
              const topOption = getTopOption(event.id)
              const timeLeft = getTimeLeft(event.ends_at)

              return (
                <Card
                  key={event.id}
                  className="p-6 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-background"
                >
                  {event.banner_image && (
                    <div className="mb-4 border-2 border-secondary">
                      <img
                        src={event.banner_image || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-3 text-balance">{event.title}</h3>
                    <p className="text-muted-foreground mb-3 text-sm">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {totalVotes.toLocaleString()} votes
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {event.view_count} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {timeLeft}
                      </div>
                    </div>
                  </div>

                  {topOption && (
                    <div className="mb-6 p-3 border-2 border-primary bg-primary/10">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">Leading: {topOption.option_name}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-primary-foreground font-bold">
                            {Math.round((Number(topOption.vote_count) / totalVotes) * 100)}%
                          </Badge>
                          <span className="text-sm font-bold text-primary">{topOption.vote_count} votes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      asChild
                      className="flex-1 border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px] shadow-secondary transition-all duration-200 font-bold"
                    >
                      <Link href={`/vote/${event.id}`}>VIEW DETAILS</Link>
                    </Button>
                    <Badge className="bg-secondary text-secondary-foreground font-bold px-3 py-2">
                      {event.points_required} PTS
                    </Badge>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px] shadow-secondary transition-all duration-200 font-bold bg-background"
          >
            <Link href="/vote">VIEW ALL POLLS</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
