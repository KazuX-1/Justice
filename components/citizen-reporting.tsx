"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Shield, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface ReportStats {
  total_reports: number
  resolved_cases: number
}

export function CitizenReporting() {
  const [stats, setStats] = useState<ReportStats>({ total_reports: 0, resolved_cases: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchStats = async () => {
      const { data: reports } = await supabase.from("citizen_reports").select("status")

      if (reports) {
        const totalReports = reports.length
        const resolvedCases = reports.filter((r) => r.status === "resolved").length
        setStats({ total_reports: totalReports, resolved_cases: resolvedCases })
      }
    }

    fetchStats()

    const channel = supabase
      .channel("citizen_reports_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "citizen_reports" }, () => {
        fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const reportData = {
      title: `${formData.get("category")} Report - ${formData.get("location")}`,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      location: formData.get("location") as string,
    }

    const { data: user } = await supabase.auth.getUser()
    if (user.user) {
      const { error } = await supabase.from("citizen_reports").insert([
        {
          ...reportData,
          reporter_id: user.user.id,
        },
      ])

      if (!error) {
        alert("Report submitted successfully!")
        ;(e.target as HTMLFormElement).reset()
      } else {
        alert("Error submitting report. Please try again.")
      }
    }

    setIsSubmitting(false)
  }

  return (
    <section className="py-20 bg-card border-b-8 border-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-black text-foreground">REPORT INJUSTICE</h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Safely report corruption, unfair governance, or violations of citizens' rights
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Reporting Form */}
            <Card className="p-8 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-background">
              <h3 className="text-2xl font-black text-foreground mb-6">SUBMIT REPORT</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">REPORT TYPE</label>
                  <Select name="category" required>
                    <SelectTrigger className="border-4 border-secondary rounded-none h-12 font-medium">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corruption">Corruption</SelectItem>
                      <SelectItem value="abuse">Abuse of Power</SelectItem>
                      <SelectItem value="discrimination">Discrimination</SelectItem>
                      <SelectItem value="environmental">Environmental Violation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">LOCATION</label>
                  <Input
                    name="location"
                    placeholder="City, Province"
                    className="border-4 border-secondary rounded-none h-12 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">INCIDENT DESCRIPTION</label>
                  <Textarea
                    name="description"
                    placeholder="Describe what happened, when, and who was involved..."
                    className="border-4 border-secondary rounded-none min-h-32 font-medium resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">EVIDENCE (OPTIONAL)</label>
                  <div className="border-4 border-dashed border-secondary p-6 text-center bg-muted">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Upload photos, documents, or other evidence
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px] shadow-secondary transition-all duration-200 font-bold h-12 disabled:opacity-50"
                >
                  {isSubmitting ? "SUBMITTING..." : "SUBMIT REPORT"}
                </Button>
              </form>
            </Card>

            {/* Safety Information */}
            <div className="space-y-6">
              <Card className="p-6 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-background">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-black text-foreground">YOUR SAFETY FIRST</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>All reports are encrypted and stored securely</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>You can choose to remain anonymous</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>Reports are reviewed by verified legal experts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>We provide legal guidance and support resources</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-accent/10">
                <h3 className="text-lg font-black text-foreground mb-3">LIVE IMPACT</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-primary animate-pulse">
                      {stats.total_reports.toLocaleString()}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">REPORTS FILED</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-primary animate-pulse">{stats.resolved_cases}</div>
                    <div className="text-xs font-medium text-muted-foreground">CASES RESOLVED</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
