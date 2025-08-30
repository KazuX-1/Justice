"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Vote, Users, Eye, TrendingUp, MessageCircle, Heart, Send } from "lucide-react"
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
  view_count: number
  interaction_score: number
}

interface VoteStats {
  option_name: string
  vote_count: number
  total_points: number
}

interface UserVote {
  option_selected: string
  points_used: number
}

interface Comment {
  id: string
  content: string
  username: string
  like_count: number
  created_at: string
  user_liked: boolean
}

export default function VoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [voteEvent, setVoteEvent] = useState<VoteEvent | null>(null)
  const [voteStats, setVoteStats] = useState<VoteStats[]>([])
  const [userVote, setUserVote] = useState<UserVote | null>(null)
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userPoints, setUserPoints] = useState(1000)

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [username, setUsername] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchVoteEvent()
      checkUser()
      fetchComments()
    }
  }, [params.id])

  useEffect(() => {
    if (!params.id) return

    const commentsSubscription = supabase
      .channel(`vote_comments_${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vote_comments",
          filter: `vote_event_id=eq.${params.id}`,
        },
        () => {
          fetchComments()
        },
      )
      .subscribe()

    const likesSubscription = supabase
      .channel(`comment_likes_${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comment_likes",
        },
        () => {
          fetchComments()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(commentsSubscription)
      supabase.removeChannel(likesSubscription)
    }
  }, [params.id])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      setUser(user)
      // Get user points and username
      const { data: profile } = await supabase.from("users").select("points, username").eq("id", user.id).single()

      if (profile) {
        setUserPoints(profile.points || 1000)
        setUsername(profile.username || "")
      }
    }
  }

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("vote_comments")
        .select(`
          id,
          content,
          username,
          like_count,
          created_at,
          user_id
        `)
        .eq("vote_event_id", params.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (commentsData && user) {
        // Check which comments the user has liked
        const { data: userLikes } = await supabase.from("comment_likes").select("comment_id").eq("user_id", user.id)

        const likedCommentIds = new Set(userLikes?.map((like) => like.comment_id) || [])

        const commentsWithLikes = commentsData.map((comment) => ({
          ...comment,
          user_liked: likedCommentIds.has(comment.id),
        }))

        setComments(commentsWithLikes)
      } else if (commentsData) {
        setComments(commentsData.map((comment) => ({ ...comment, user_liked: false })))
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const submitComment = async () => {
    if (!user || !newComment.trim() || !username) return

    setSubmittingComment(true)

    try {
      const { error } = await supabase.from("vote_comments").insert({
        vote_event_id: params.id,
        user_id: user.id,
        username: username,
        content: newComment.trim(),
      })

      if (error) throw error

      // Track comment interaction
      await supabase.from("vote_interactions").upsert({
        vote_event_id: params.id,
        user_id: user.id,
        interaction_type: "comment",
      })

      setNewComment("")
      fetchComments()
    } catch (error) {
      console.error("Error submitting comment:", error)
      alert("Gagal mengirim komentar")
    } finally {
      setSubmittingComment(false)
    }
  }

  const toggleLike = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) return

    try {
      if (currentlyLiked) {
        // Unlike
        await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id)
      } else {
        // Like
        await supabase.from("comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
        })
      }

      fetchComments()
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const fetchVoteEvent = async () => {
    try {
      // Fetch vote event details
      const { data: event, error } = await supabase.from("vote_events").select("*").eq("id", params.id).single()

      if (error) throw error
      if (!event) {
        router.push("/vote")
        return
      }

      setVoteEvent(event)

      // Track view interaction
      if (user) {
        await supabase.from("vote_interactions").upsert({
          vote_event_id: event.id,
          user_id: user.id,
          interaction_type: "view",
        })
      }

      // Fetch vote statistics
      const { data: stats } = await supabase.rpc("get_vote_statistics", {
        event_id: event.id,
      })
      if (stats) setVoteStats(stats)

      // Check if user has already voted
      if (user) {
        const { data: existingVote } = await supabase
          .from("votes")
          .select("option_selected, points_used")
          .eq("vote_event_id", event.id)
          .eq("user_id", user.id)
          .single()

        if (existingVote) {
          setUserVote(existingVote)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching vote event:", error)
      router.push("/vote")
    }
  }

  const handleVote = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (!selectedOption || !voteEvent) return

    if (userPoints < voteEvent.points_required) {
      alert("Poin tidak cukup untuk voting!")
      return
    }

    setVoting(true)

    try {
      const { error } = await supabase.rpc("cast_vote", {
        p_vote_event_id: voteEvent.id,
        p_user_id: user.id,
        p_option_selected: selectedOption,
        p_points_used: voteEvent.points_required,
      })

      if (error) throw error

      // Track vote interaction
      await supabase.from("vote_interactions").upsert({
        vote_event_id: voteEvent.id,
        user_id: user.id,
        interaction_type: "vote",
      })

      // Refresh data
      await fetchVoteEvent()
      await checkUser()

      alert("Vote berhasil!")
    } catch (error: any) {
      console.error("Error voting:", error)
      alert(error.message || "Gagal melakukan vote")
    } finally {
      setVoting(false)
    }
  }

  const getTotalVotes = () => {
    return voteStats.reduce((total, stat) => total + Number(stat.vote_count), 0)
  }

  const getOptionPercentage = (optionName: string) => {
    const totalVotes = getTotalVotes()
    if (totalVotes === 0) return 0
    const stat = voteStats.find((s) => s.option_name === optionName)
    return stat ? Math.round((Number(stat.vote_count) / totalVotes) * 100) : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-emerald-400 font-black text-2xl">LOADING...</div>
      </div>
    )
  }

  if (!voteEvent) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-red-400 font-black text-2xl">VOTE EVENT NOT FOUND</div>
      </div>
    )
  }

  const totalVotes = getTotalVotes()
  const isExpired = voteEvent.ends_at && new Date(voteEvent.ends_at) < new Date()

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <div className="bg-zinc-800 border-b-4 border-emerald-400 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/vote">
            <Button
              variant="outline"
              className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-zinc-900 font-bold bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              KEMBALI
            </Button>
          </Link>
          <div className="flex items-center gap-4 text-zinc-300">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-bold">{voteEvent.view_count} views</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-bold">{voteEvent.interaction_score} score</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="font-bold">{comments.length} comments</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Banner Image */}
        {voteEvent.banner_image && (
          <div className="border-4 border-emerald-400 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
            <img
              src={voteEvent.banner_image || "/placeholder.svg"}
              alt={voteEvent.title}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        )}

        {/* Vote Event Header */}
        <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div>
                <CardTitle className="text-3xl font-black text-emerald-400 uppercase mb-4">{voteEvent.title}</CardTitle>
                <p className="text-zinc-300 font-bold text-lg mb-4">{voteEvent.description}</p>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span>Dibuat: {new Date(voteEvent.created_at).toLocaleDateString("id-ID")}</span>
                  {voteEvent.ends_at && (
                    <span>
                      {isExpired ? "Berakhir" : "Berakhir"}: {new Date(voteEvent.ends_at).toLocaleDateString("id-ID")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  className={`font-black ${
                    voteEvent.is_active && !isExpired ? "bg-emerald-400 text-zinc-900" : "bg-red-400 text-zinc-900"
                  }`}
                >
                  {voteEvent.is_active && !isExpired ? "AKTIF" : "BERAKHIR"}
                </Badge>
                <Badge className="bg-orange-400 text-zinc-900 font-black">{voteEvent.points_required} POIN</Badge>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Users className="w-4 h-4" />
                  <span className="font-bold">{totalVotes} votes</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Article Content */}
        {voteEvent.article_content && (
          <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-emerald-400 uppercase">ARTIKEL LENGKAP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <div className="text-zinc-300 font-medium leading-relaxed whitespace-pre-wrap">
                  {voteEvent.article_content}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voting Section */}
        <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-emerald-400 uppercase flex items-center gap-2">
              <Vote className="w-6 h-6" />
              {userVote ? "HASIL VOTING" : "CAST YOUR VOTE"}
            </CardTitle>
            {user && (
              <p className="text-zinc-300 font-bold">
                Poin Anda: <span className="text-orange-400">{userPoints}</span>
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {userVote ? (
              <div className="space-y-4">
                <div className="p-4 border-2 border-emerald-400 bg-emerald-400/10 rounded">
                  <p className="text-emerald-400 font-bold">
                    Anda telah memilih: <span className="font-black">{userVote.option_selected}</span>
                  </p>
                  <p className="text-zinc-300">Poin yang digunakan: {userVote.points_used}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!user && (
                  <div className="p-4 border-2 border-orange-400 bg-orange-400/10 rounded">
                    <p className="text-orange-400 font-bold">Anda harus login untuk dapat voting.</p>
                  </div>
                )}
                {user && userPoints < voteEvent.points_required && (
                  <div className="p-4 border-2 border-red-400 bg-red-400/10 rounded">
                    <p className="text-red-400 font-bold">
                      Poin tidak cukup untuk voting. Dibutuhkan {voteEvent.points_required} poin.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Vote Options */}
            <div className="space-y-4">
              {voteEvent.options.map((option, index) => {
                const percentage = getOptionPercentage(option)
                const stat = voteStats.find((s) => s.option_name === option)
                const voteCount = stat ? Number(stat.vote_count) : 0
                const isSelected = selectedOption === option
                const isUserChoice = userVote?.option_selected === option

                return (
                  <div
                    key={index}
                    className={`p-4 border-4 cursor-pointer transition-all ${
                      isUserChoice
                        ? "border-emerald-400 bg-emerald-400/20"
                        : isSelected
                          ? "border-orange-400 bg-orange-400/10"
                          : "border-zinc-600 bg-zinc-700 hover:border-zinc-500"
                    }`}
                    onClick={() => {
                      if (!userVote && user && voteEvent.is_active && !isExpired) {
                        setSelectedOption(option)
                      }
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-zinc-100 text-lg">{option}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-emerald-400 font-black">
                          {voteCount} votes ({percentage}%)
                        </span>
                        {stat && <span className="text-orange-400 font-black">{stat.total_points} poin</span>}
                      </div>
                    </div>
                    <div className="h-4 bg-zinc-600 border-2 border-zinc-500 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Vote Button */}
            {!userVote && user && voteEvent.is_active && !isExpired && (
              <Button
                onClick={handleVote}
                disabled={!selectedOption || voting || userPoints < voteEvent.points_required}
                className="w-full bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black uppercase border-2 border-emerald-600 text-lg py-6"
              >
                {voting ? "VOTING..." : `VOTE (${voteEvent.points_required} POIN)`}
              </Button>
            )}

            {!user && (
              <Link href="/auth/login">
                <Button className="w-full bg-orange-400 hover:bg-orange-500 text-zinc-900 font-black uppercase border-2 border-orange-600 text-lg py-6">
                  LOGIN UNTUK VOTE
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-emerald-400 uppercase flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              DISKUSI ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comment Form */}
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="font-bold">Komentar sebagai:</span>
                  <Badge className="bg-emerald-400 text-zinc-900 font-bold">{username}</Badge>
                </div>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Bagikan pendapat Anda tentang topik ini..."
                  className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-medium resize-none"
                  rows={3}
                />
                <Button
                  onClick={submitComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black uppercase border-2 border-emerald-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submittingComment ? "MENGIRIM..." : "KIRIM KOMENTAR"}
                </Button>
              </div>
            ) : (
              <div className="p-4 border-2 border-orange-400 bg-orange-400/10 rounded text-center">
                <p className="text-orange-400 font-bold mb-2">Login untuk bergabung dalam diskusi</p>
                <Link href="/auth/login">
                  <Button className="bg-orange-400 hover:bg-orange-500 text-zinc-900 font-black uppercase border-2 border-orange-600">
                    LOGIN
                  </Button>
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 font-bold">Belum ada komentar. Jadilah yang pertama!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-4 border-2 border-zinc-600 bg-zinc-700 rounded space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-zinc-600 text-zinc-100 font-bold">{comment.username}</Badge>
                        <span className="text-zinc-400 text-sm">
                          {new Date(comment.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {user && (
                        <Button
                          onClick={() => toggleLike(comment.id, comment.user_liked)}
                          variant="ghost"
                          size="sm"
                          className={`flex items-center gap-1 ${
                            comment.user_liked ? "text-red-400 hover:text-red-300" : "text-zinc-400 hover:text-red-400"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${comment.user_liked ? "fill-current" : ""}`} />
                          <span className="font-bold">{comment.like_count}</span>
                        </Button>
                      )}
                    </div>
                    <p className="text-zinc-100 font-medium leading-relaxed">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
