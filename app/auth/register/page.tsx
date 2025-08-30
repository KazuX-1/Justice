"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Jambi",
  "Sumatera Selatan",
  "Bengkulu",
  "Lampung",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Banten",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Sulawesi Tengah",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Gorontalo",
  "Sulawesi Barat",
  "Maluku",
  "Maluku Utara",
  "Papua Barat",
  "Papua",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Barat Daya",
]

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    kota: "",
    provinsi: "",
    umur: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter")
      setIsLoading(false)
      return
    }

    const age = Number.parseInt(formData.umur)
    if (age < 17 || age > 100) {
      setError("Umur harus antara 17-100 tahun")
      setIsLoading(false)
      return
    }

    if (!formData.username || !formData.kota || !formData.provinsi) {
      setError("Semua field harus diisi")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            username: formData.username,
            kota: formData.kota,
            provinsi: formData.provinsi,
            umur: age,
          },
        },
      })
      if (error) throw error
      router.push("/auth/register-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-black text-emerald-400 uppercase tracking-wider">DAFTAR</CardTitle>
            <CardDescription className="text-zinc-300 font-bold">Bergabung sebagai pejuang keadilan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-100 font-bold uppercase text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-0 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-zinc-100 font-bold uppercase text-sm">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="username_anda"
                    required
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-0 h-12 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-100 font-bold uppercase text-sm">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-0 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-zinc-100 font-bold uppercase text-sm">
                    Konfirmasi
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-0 h-12 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kota" className="text-zinc-100 font-bold uppercase text-sm">
                    Kota
                  </Label>
                  <Input
                    id="kota"
                    type="text"
                    placeholder="Jakarta"
                    required
                    value={formData.kota}
                    onChange={(e) => handleInputChange("kota", e.target.value)}
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-0 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="umur" className="text-zinc-100 font-bold uppercase text-sm">
                    Umur
                  </Label>
                  <Input
                    id="umur"
                    type="number"
                    placeholder="25"
                    min="17"
                    max="100"
                    required
                    value={formData.umur}
                    onChange={(e) => handleInputChange("umur", e.target.value)}
                    className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-0 h-12 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provinsi" className="text-zinc-100 font-bold uppercase text-sm">
                  Provinsi
                </Label>
                <Select value={formData.provinsi} onValueChange={(value) => handleInputChange("provinsi", value)}>
                  <SelectTrigger className="border-2 border-zinc-600 bg-zinc-700 text-zinc-100 focus:border-emerald-400 focus:ring-0 h-12 font-bold">
                    <SelectValue placeholder="Pilih Provinsi" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-700 border-2 border-zinc-600">
                    {PROVINCES.map((province) => (
                      <SelectItem
                        key={province}
                        value={province}
                        className="text-zinc-100 font-bold focus:bg-emerald-400 focus:text-zinc-900"
                      >
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="bg-red-500 border-2 border-red-700 p-3 text-white font-bold text-sm">{error}</div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black text-lg uppercase tracking-wider h-14 border-2 border-emerald-600 shadow-[4px_4px_0px_0px_theme(colors.emerald.600)] hover:shadow-[2px_2px_0px_0px_theme(colors.emerald.600)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                {isLoading ? "MENDAFTAR..." : "DAFTAR SEKARANG"}
              </Button>

              <div className="text-center">
                <p className="text-zinc-300 font-bold">
                  Sudah punya akun?{" "}
                  <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 underline font-black">
                    MASUK
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
