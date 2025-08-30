"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ManageAdminsPage() {
  const [user, setUser] = useState<any>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    username: "",
    kota: "",
    provinsi: "",
    password: "admin123", // Default password
  })
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    checkUser()
    fetchAdmins()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profile?.username?.startsWith("admin_")) {
        setUser(profile)
      }
    }
  }

  const fetchAdmins = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .like("username", "admin_%")
        .order("created_at", { ascending: false })

      setAdmins(data || [])
    } catch (error) {
      console.error("Error fetching admins:", error)
    }
  }

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            username: newAdmin.username.startsWith("admin_") ? newAdmin.username : `admin_${newAdmin.username}`,
            kota: newAdmin.kota,
            provinsi: newAdmin.provinsi,
            umur: 25, // Default age
          },
        },
      })

      if (authError) throw authError

      alert("Admin account created successfully!")
      setNewAdmin({ email: "", username: "", kota: "", provinsi: "", password: "admin123" })
      fetchAdmins()
    } catch (error: any) {
      alert("Error creating admin: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Card className="bg-gray-800 border-emerald-400 border-4">
          <CardContent className="p-8">
            <h1 className="text-2xl font-black text-emerald-400">ACCESS DENIED</h1>
            <p className="text-gray-300 mt-2">Only admins can access this page</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-emerald-400 border-b-4 border-emerald-400 pb-4">MANAGE ADMINS</h1>
          <Link href="/admin">
            <Button
              variant="outline"
              className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-gray-900 font-bold bg-transparent"
            >
              KEMBALI KE ADMIN
            </Button>
          </Link>
        </div>

        {/* Create New Admin */}
        <Card className="bg-gray-800 border-emerald-400 border-4 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-emerald-400">CREATE NEW ADMIN</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="bg-gray-700 border-2 border-gray-600 text-white"
                  required
                />
                <Input
                  type="text"
                  placeholder="Username (will add admin_ prefix)"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  className="bg-gray-700 border-2 border-gray-600 text-white"
                  required
                />
                <Input
                  type="text"
                  placeholder="Kota"
                  value={newAdmin.kota}
                  onChange={(e) => setNewAdmin({ ...newAdmin, kota: e.target.value })}
                  className="bg-gray-700 border-2 border-gray-600 text-white"
                  required
                />
                <Input
                  type="text"
                  placeholder="Provinsi"
                  value={newAdmin.provinsi}
                  onChange={(e) => setNewAdmin({ ...newAdmin, provinsi: e.target.value })}
                  className="bg-gray-700 border-2 border-gray-600 text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-black border-4 border-black"
              >
                {loading ? "CREATING..." : "CREATE ADMIN"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Admins */}
        <Card className="bg-gray-800 border-emerald-400 border-4">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-emerald-400">EXISTING ADMINS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {admins.map((admin) => (
                <div key={admin.id} className="bg-gray-700 p-4 border-2 border-gray-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-emerald-400">{admin.username}</h3>
                      <p className="text-gray-300">
                        {admin.kota}, {admin.provinsi}
                      </p>
                      <p className="text-sm text-gray-400">Points: {admin.points}</p>
                    </div>
                    <div className="text-sm text-gray-400">
                      Created: {new Date(admin.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
