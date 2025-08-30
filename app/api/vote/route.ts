import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { voteEventId, option, pointsSpent } = await request.json()

    // Check if user has enough points
    const { data: userProfile } = await supabase.from("users").select("points").eq("id", user.id).single()

    if (!userProfile || userProfile.points < pointsSpent) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("vote_event_id", voteEventId)
      .eq("user_id", user.id)
      .single()

    if (existingVote) {
      return NextResponse.json({ error: "Already voted" }, { status: 400 })
    }

    // Insert vote
    const { error: voteError } = await supabase.from("votes").insert({
      vote_event_id: voteEventId,
      user_id: user.id,
      option_selected: option,
      points_spent: pointsSpent,
    })

    if (voteError) throw voteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Vote API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
