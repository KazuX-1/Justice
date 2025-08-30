"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-black text-emerald-400 uppercase tracking-wider">MASUK</CardTitle>
            <CardDescription className="text-zinc-300 font-bold">Bergabung dalam perjuangan keadilan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-100 font-bold uppercase text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-0 h-12 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-100 font-bold uppercase text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-0 h-12 font-bold"
                />
              </div>
              {error && (
                <div className="bg-red-500 border-2 border-red-700 p-3 text-white font-bold text-sm">{error}</div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black text-lg uppercase tracking-wider h-14 border-2 border-emerald-600 shadow-[4px_4px_0px_0px_theme(colors.emerald.600)] hover:shadow-[2px_2px_0px_0px_theme(colors.emerald.600)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                {isLoading ? "MASUK..." : "MASUK"}
              </Button>
              <div className="text-center">
                <p className="text-zinc-300 font-bold">
                  Belum punya akun?{" "}
                  <Link href="/auth/register" className="text-emerald-400 hover:text-emerald-300 underline font-black">
                    DAFTAR SEKARANG
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
