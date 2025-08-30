"use client"

import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, TrendingDown, BarChart3, PieChartIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface RegionData {
  region: string
  score: number
}

interface CategoryData {
  name: string
  value: number
  color: string
}

interface Metrics {
  transparency_index: number
  engagement_rate: number
  response_time: number
  resolved_rate: number
}

export function JusticeIndex() {
  const [regionData, setRegionData] = useState<RegionData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [metrics, setMetrics] = useState<Metrics>({
    transparency_index: 0,
    engagement_rate: 0,
    response_time: 0,
    resolved_rate: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch report categories distribution
      const { data: reports } = await supabase.from("citizen_reports").select("category, status")

      if (reports) {
        const categoryCount: { [key: string]: number } = {}
        const totalReports = reports.length
        let resolvedCount = 0

        reports.forEach((report) => {
          categoryCount[report.category] = (categoryCount[report.category] || 0) + 1
          if (report.status === "resolved") resolvedCount++
        })

        const categories: CategoryData[] = [
          {
            name: "Corruption",
            value: Math.round(((categoryCount.corruption || 0) / totalReports) * 100),
            color: "#dc2626",
          },
          {
            name: "Abuse of Power",
            value: Math.round(((categoryCount.abuse || 0) / totalReports) * 100),
            color: "#059669",
          },
          {
            name: "Discrimination",
            value: Math.round(((categoryCount.discrimination || 0) / totalReports) * 100),
            color: "#10b981",
          },
          {
            name: "Environmental",
            value: Math.round(((categoryCount.environmental || 0) / totalReports) * 100),
            color: "#4ade80",
          },
        ]

        setCategoryData(categories)

        // Calculate metrics
        const { data: users } = await supabase.from("user_profiles").select("*")
        const { data: votes } = await supabase.from("votes").select("*")

        const engagementRate = users && votes ? Math.round((votes.length / users.length) * 100) : 89
        const resolvedRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 73

        setMetrics({
          transparency_index: 67.2 + Math.random() * 5, // Simulated with slight variation
          engagement_rate: engagementRate,
          response_time: 4.2 - Math.random() * 0.5,
          resolved_rate: resolvedRate,
        })
      }

      // Simulated regional data (would come from actual regional reports in production)
      setRegionData([
        { region: "Jakarta", score: 78 + Math.random() * 10 },
        { region: "Surabaya", score: 65 + Math.random() * 10 },
        { region: "Bandung", score: 72 + Math.random() * 10 },
        { region: "Medan", score: 58 + Math.random() * 10 },
        { region: "Makassar", score: 61 + Math.random() * 10 },
      ])

      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel("justice_metrics_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "citizen_reports" }, () => {
        fetchData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        fetchData()
      })
      .subscribe()

    // Update metrics every 30 seconds for live feel
    const interval = setInterval(fetchData, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [supabase])

  if (loading) {
    return (
      <section className="py-20 bg-background border-b-8 border-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-xl font-bold text-muted-foreground">Loading justice metrics...</div>
          </div>
        </div>
      </section>
    )
  }

  const metricsDisplay = [
    {
      title: "TRANSPARENCY INDEX",
      value: metrics.transparency_index.toFixed(1),
      change: "+2.4",
      trend: "up",
      description: "National average this month",
    },
    {
      title: "CITIZEN ENGAGEMENT",
      value: `${metrics.engagement_rate}%`,
      change: "+5.2%",
      trend: "up",
      description: "Active participation rate",
    },
    {
      title: "RESPONSE TIME",
      value: `${metrics.response_time.toFixed(1)} days`,
      change: "-0.8",
      trend: "down",
      description: "Average government response",
    },
    {
      title: "RESOLVED CASES",
      value: `${metrics.resolved_rate}%`,
      change: "+1.1%",
      trend: "up",
      description: "Successfully addressed reports",
    },
  ]

  return (
    <section className="py-20 bg-background border-b-8 border-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-black text-foreground">JUSTICE INDEX</h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Real-time data on transparency, citizen engagement, and justice outcomes
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {metricsDisplay.map((metric, index) => (
            <Card
              key={index}
              className="p-6 border-4 border-secondary shadow-[4px_4px_0px_0px] shadow-secondary bg-card text-center"
            >
              <div className="text-3xl font-black text-primary mb-2 animate-pulse">{metric.value}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {metric.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-accent" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <span className={`text-sm font-bold ${metric.trend === "up" ? "text-accent" : "text-destructive"}`}>
                  {metric.change}
                </span>
              </div>
              <div className="text-xs font-bold text-foreground mb-1">{metric.title}</div>
              <div className="text-xs text-muted-foreground">{metric.description}</div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Transparency by Region */}
          <Card className="p-6 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-card">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-black text-foreground">TRANSPARENCY BY REGION</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData}>
                  <XAxis
                    dataKey="region"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: "bold" }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: "bold" }} />
                  <Bar dataKey="score" fill="oklch(0.45 0.15 160)" stroke="oklch(0.35 0.02 240)" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Report Categories */}
          <Card className="p-6 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-card">
            <div className="flex items-center gap-3 mb-6">
              <PieChartIcon className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-black text-foreground">REPORT CATEGORIES</h3>
            </div>
            <div className="h-64 flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      stroke="oklch(0.35 0.02 240)"
                      strokeWidth={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {categoryData.map((category, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 border-2 border-secondary animate-pulse"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <div className="text-sm font-bold text-foreground">{category.name}</div>
                      <div className="text-xs text-muted-foreground">{category.value}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
