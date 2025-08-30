"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, X, Vote, Heart, UserPlus, AlertTriangle } from "lucide-react"

interface Notification {
  id: string
  type: "vote" | "donation" | "registration" | "admin"
  title: string
  message: string
  timestamp: string
  read: boolean
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Set up real-time subscriptions for notifications
    const voteChannel = supabase
      .channel("vote-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "vote_events" }, (payload) => {
        console.log("[v0] New vote event notification:", payload.new)
        addNotification({
          id: `vote-${payload.new.id}`,
          type: "vote",
          title: "Vote Event Baru!",
          message: `"${payload.new.title}" - Berikan suara Anda sekarang!`,
          timestamp: payload.new.created_at,
          read: false,
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(voteChannel)
    }
  }, [])

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 9)])
    setUnreadCount((prev) => prev + 1)

    // Show browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    setUnreadCount(0)
  }

  const requestNotificationPermission = async () => {
    if (Notification.permission === "default") {
      await Notification.requestPermission()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "vote":
        return <Vote className="w-4 h-4 text-blue-500" />
      case "donation":
        return <Heart className="w-4 h-4 text-green-500" />
      case "registration":
        return <UserPlus className="w-4 h-4 text-purple-500" />
      case "admin":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      default:
        return <Bell className="w-4 h-4" />
    }
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
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setShowNotifications(!showNotifications)
          requestNotificationPermission()
        }}
        className="relative border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-zinc-900 font-bold bg-transparent"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)] z-50">
          <div className="p-4 border-b border-zinc-600">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-emerald-400 uppercase">NOTIFIKASI</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-zinc-400 hover:text-emerald-400"
                  >
                    Tandai Semua
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                  className="text-zinc-400 hover:text-emerald-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-zinc-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-zinc-700 cursor-pointer hover:bg-zinc-700/50 transition-colors ${
                    !notification.read ? "bg-emerald-400/5" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-zinc-100">{notification.title}</h4>
                        {!notification.read && <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>}
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">{notification.message}</p>
                      <p className="text-xs text-zinc-500 mt-1">{formatTimeAgo(notification.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
