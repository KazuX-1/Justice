"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PromoteAdminPage() {
  const [email, setEmail] = useState("dimasset9809@gmail.com")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const supabase = createClient()

  const promoteUser = async () => {
    setLoading(true)
    setResult("")

    try {
      const { data, error } = await supabase.rpc("promote_user_to_admin", {
        user_email: email,
      })

      if (error) {
        console.error("Error promoting user:", error)
        setResult(`Error: ${error.message}`)
      } else {
        console.log("Promotion result:", data)
        if (data.success) {
          setResult(
            `✅ SUCCESS: ${data.message}\nOld username: ${data.old_username}\nNew username: ${data.new_username}`,
          )
        } else {
          setResult(`❌ FAILED: ${data.message}`)
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      setResult(`❌ Unexpected error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4 flex items-center justify-center">
      <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)] w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-emerald-400 uppercase text-center">
            PROMOSIKAN USER KE ADMIN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-zinc-100 font-bold uppercase">Email User</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 font-bold"
              placeholder="user@example.com"
            />
          </div>

          <Button
            onClick={promoteUser}
            disabled={loading || !email}
            className="w-full bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black uppercase border-2 border-emerald-600"
          >
            {loading ? "MEMPROSES..." : "PROMOSIKAN KE ADMIN"}
          </Button>

          {result && (
            <div className="p-4 border-2 border-zinc-600 bg-zinc-700 rounded">
              <pre className="text-sm text-zinc-100 whitespace-pre-wrap font-mono">{result}</pre>
            </div>
          )}

          <div className="text-center">
            <a href="/dashboard" className="text-emerald-400 hover:text-emerald-300 font-bold underline">
              ← Kembali ke Dashboard
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
