"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Vote, Heart, UserPlus, AlertTriangle } from "lucide-react"

interface ActivityItem {
  id: string
  type: "vote" | "donation" | "registration" | "report"
  description: string
  timestamp: string
  amount?: number
  location?: string
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchRecentActivities()

    // Set up real-time subscriptions for multiple tables
    const voteChannel = supabase
      .channel("vote-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes" }, (payload) => {
        console.log("[v0] New vote activity:", payload.new)
        addActivity({
          id: payload.new.id,
          type: "vote",
          description: `Seseorang memberikan suara untuk "${payload.new.option_selected}"`,
          timestamp: payload.new.created_at,
        })
      })
      .subscribe()

    const donationChannel = supabase
      .channel("donation-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "donations" }, (payload) => {
        console.log("[v0] New donation activity:", payload.new)
        const donorName = payload.new.is_anonymous ? "Seseorang" : payload.new.donor_name || "Seseorang"
        addActivity({
          id: payload.new.id,
          type: "donation",
          description: `${donorName} berdonasi untuk ${payload.new.cause}`,
          timestamp: payload.new.created_at,
          amount: payload.new.amount,
        })
      })
      .subscribe()

    const userChannel = supabase
      .channel("user-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "users" }, (payload) => {
        console.log("[v0] New user registration:", payload.new)
        addActivity({
          id: payload.new.id,
          type: "registration",
          description: `${payload.new.username} bergabung dari ${payload.new.kota}, ${payload.new.provinsi}`,
          timestamp: payload.new.created_at,
          location: `${payload.new.kota}, ${payload.new.provinsi}`,
        })
      })
      .subscribe()

    // Check connection status
    const checkConnection = () => {
      setIsConnected(
        voteChannel.state === "joined" && donationChannel.state === "joined" && userChannel.state === "joined",
      )
    }

    const interval = setInterval(checkConnection, 1000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(voteChannel)
      supabase.removeChannel(donationChannel)
      supabase.removeChannel(userChannel)
    }
  }, [])

  const fetchRecentActivities = async () => {
    // Fetch recent votes
    const { data: votes } = await supabase
      .from("votes")
      .select("id, option_selected, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    // Fetch recent donations
    const { data: donations } = await supabase
      .from("donations")
      .select("id, donor_name, cause, amount, is_anonymous, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    // Fetch recent users
    const { data: users } = await supabase
      .from("users")
      .select("id, username, kota, provinsi, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    const allActivities: ActivityItem[] = []

    if (votes) {
      votes.forEach((vote) => {
        allActivities.push({
          id: vote.id,
          type: "vote",
          description: `Seseorang memberikan suara untuk "${vote.option_selected}"`,
          timestamp: vote.created_at,
        })
      })
    }

    if (donations) {
      donations.forEach((donation) => {
        const donorName = donation.is_anonymous ? "Seseorang" : donation.donor_name || "Seseorang"
        allActivities.push({
          id: donation.id,
          type: "donation",
          description: `${donorName} berdonasi untuk ${donation.cause}`,
          timestamp: donation.created_at,
          amount: donation.amount,
        })
      })
    }

    if (users) {
      users.forEach((user) => {
        allActivities.push({
          id: user.id,
          type: "registration",
          description: `${user.username} bergabung dari ${user.kota}, ${user.provinsi}`,
          timestamp: user.created_at,
          location: `${user.kota}, ${user.provinsi}`,
        })
      })
    }

    // Sort by timestamp and take the most recent 10
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setActivities(allActivities.slice(0, 10))
  }

  const addActivity = (newActivity: ActivityItem) => {
    setActivities((prev) => [newActivity, ...prev.slice(0, 9)])
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "vote":
        return <Vote className="w-4 h-4" />
      case "donation":
        return <Heart className="w-4 h-4" />
      case "registration":
        return <UserPlus className="w-4 h-4" />
      case "report":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "vote":
        return "bg-blue-500"
      case "donation":
        return "bg-green-500"
      case "registration":
        return "bg-purple-500"
      case "report":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-black text-foreground flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          LIVE ACTIVITY
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Memuat aktivitas terbaru...</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 border border-secondary/20 hover:bg-accent/5 transition-colors"
              >
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                    {activity.amount && (
                      <Badge variant="outline" className="text-xs">
                        {formatCurrency(activity.amount)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
