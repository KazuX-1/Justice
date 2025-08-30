"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PromoteUserPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createBrowserClient()

  const promoteUser = async () => {
    if (!email) {
      setMessage("Email harus diisi")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase.rpc("promote_user_to_admin", {
        user_email: email,
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage(`User ${email} berhasil dipromosikan menjadi admin!`)
        setEmail("")
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-800 border-4 border-emerald-400">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-emerald-400 text-center">
              PROMOSIKAN USER MENJADI ADMIN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-white font-bold mb-2">EMAIL USER:</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-gray-700 border-2 border-gray-600 text-white font-mono"
              />
            </div>

            <Button
              onClick={promoteUser}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black py-3 border-4 border-black"
            >
              {loading ? "MEMPROSES..." : "PROMOSIKAN KE ADMIN"}
            </Button>

            {message && (
              <div
                className={`p-4 border-4 font-bold ${
                  message.includes("Error")
                    ? "bg-red-500 border-red-700 text-white"
                    : "bg-emerald-500 border-emerald-700 text-black"
                }`}
              >
                {message}
              </div>
            )}

            <div className="bg-gray-700 p-4 border-2 border-gray-600">
              <h3 className="text-emerald-400 font-bold mb-2">CARA PENGGUNAAN:</h3>
              <ul className="text-white text-sm space-y-1">
                <li>1. Masukkan email user yang ingin dijadikan admin</li>
                <li>2. Klik tombol "PROMOSIKAN KE ADMIN"</li>
                <li>3. Username user akan otomatis diubah dengan prefix "admin_"</li>
                <li>4. User dapat langsung mengakses panel admin</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
