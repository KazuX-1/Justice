"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageSquare, Clock, User, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

interface Discussion {
  id: string
  title: string
  author_username: string
  reply_count: number
  updated_at: string
  category: string
  is_hot: boolean
}

export function ForumPreview() {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)

  const mockDiscussions: Discussion[] = [
    {
      id: "1",
      title: "Transparency in Local Government Budget Allocation",
      author_username: "citizen_jakarta",
      reply_count: 23,
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      category: "Transparency",
      is_hot: true,
    },
    {
      id: "2",
      title: "Election Monitoring: How Can Citizens Get Involved?",
      author_username: "democracy_watch",
      reply_count: 15,
      updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      category: "Elections",
      is_hot: false,
    },
    {
      id: "3",
      title: "Environmental Justice: Protecting Our Communities",
      author_username: "green_activist",
      reply_count: 8,
      updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      category: "Environment",
      is_hot: false,
    },
    {
      id: "4",
      title: "Anti-Corruption Efforts: What's Working?",
      author_username: "justice_seeker",
      reply_count: 31,
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      category: "Anti-Corruption",
      is_hot: true,
    },
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setDiscussions(mockDiscussions)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  if (loading) {
    return (
      <section className="py-20 bg-background border-b-8 border-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-xl font-bold text-muted-foreground">Loading discussions...</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-background border-b-8 border-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-black text-foreground">COMMUNITY FORUM</h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join ongoing discussions about justice, governance, and civic issues
          </p>
          <div className="mt-4 p-3 bg-accent/20 border-2 border-accent text-accent-foreground text-sm font-medium rounded">
            Showing sample discussions - Run database setup scripts to enable real-time forum
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-4 mb-8">
            {discussions.map((discussion) => (
              <Card
                key={discussion.id}
                className="p-6 border-4 border-secondary shadow-[4px_4px_0px_0px] shadow-secondary bg-card hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 text-xs font-bold border-2 border-secondary ${
                          discussion.category === "Transparency"
                            ? "bg-accent text-accent-foreground"
                            : discussion.category === "Elections"
                              ? "bg-primary text-primary-foreground"
                              : discussion.category === "Environment"
                                ? "bg-chart-3 text-foreground"
                                : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {discussion.category.toUpperCase()}
                      </span>
                      {discussion.is_hot && (
                        <span className="px-2 py-1 text-xs font-bold bg-destructive text-destructive-foreground border-2 border-secondary animate-pulse">
                          HOT
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-3 text-balance">{discussion.title}</h3>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {discussion.author_username}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {discussion.reply_count} replies
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTimeAgo(discussion.updated_at)}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px] shadow-secondary transition-all duration-200 font-bold mr-4"
            >
              JOIN DISCUSSIONS
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px] shadow-secondary transition-all duration-200 font-bold bg-background"
            >
              START NEW TOPIC
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
