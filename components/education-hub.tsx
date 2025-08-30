"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, FileText, Video, Users, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Resource {
  id: string
  title: string
  description: string
  type: string
  category: string
  read_time: string
  view_count: number
}

interface Category {
  name: string
  count: number
  color: string
}

export function EducationHub() {
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: resourcesData } = await supabase
        .from("education_resources")
        .select("*")
        .order("view_count", { ascending: false })
        .limit(4)

      if (resourcesData) {
        setResources(resourcesData)

        // Calculate category counts
        const { data: allResources } = await supabase.from("education_resources").select("category")

        if (allResources) {
          const categoryCount: { [key: string]: number } = {}
          allResources.forEach((resource) => {
            categoryCount[resource.category] = (categoryCount[resource.category] || 0) + 1
          })

          const categoriesData: Category[] = [
            { name: "Citizens' Rights", count: categoryCount["Rights"] || 0, color: "bg-primary" },
            { name: "Legal Process", count: categoryCount["Legal Process"] || 0, color: "bg-accent" },
            { name: "Transparency", count: categoryCount["Transparency"] || 0, color: "bg-chart-3" },
            { name: "Activism", count: categoryCount["Activism"] || 0, color: "bg-secondary" },
          ]

          setCategories(categoriesData)
        }
      }

      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel("education_resources_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "education_resources" }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const getIcon = (type: string) => {
    switch (type) {
      case "article":
        return FileText
      case "guide":
        return BookOpen
      case "video":
        return Video
      case "workshop":
        return Users
      default:
        return FileText
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-xl font-bold text-muted-foreground">Loading education resources...</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-black text-foreground">EDUCATION HUB</h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Learn about your rights, legal processes, and how to create positive change
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="p-4 border-4 border-secondary shadow-[4px_4px_0px_0px] shadow-secondary bg-background text-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer"
              >
                <div className={`w-12 h-12 ${category.color} border-2 border-secondary mx-auto mb-3`}></div>
                <div className="text-sm font-bold text-foreground mb-1">{category.name}</div>
                <div className="text-xs text-muted-foreground animate-pulse">{category.count} resources</div>
              </Card>
            ))}
          </div>

          {/* Featured Resources */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {resources.map((resource) => {
              const IconComponent = getIcon(resource.type)
              return (
                <Card
                  key={resource.id}
                  className="p-6 border-4 border-secondary shadow-[6px_6px_0px_0px] shadow-secondary bg-background hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary border-2 border-secondary">
                      <IconComponent className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs font-bold bg-accent text-accent-foreground border-2 border-secondary">
                          {resource.type.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-bold bg-secondary text-secondary-foreground border-2 border-secondary">
                          {resource.category.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-bold bg-chart-3 text-foreground border-2 border-secondary animate-pulse">
                          {resource.view_count} VIEWS
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2 text-balance">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 text-pretty">{resource.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{resource.read_time}</span>
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Card className="p-8 border-4 border-secondary shadow-[8px_8px_0px_0px] shadow-secondary bg-primary/10 max-w-2xl mx-auto">
              <h3 className="text-2xl font-black text-foreground mb-4">EMPOWER YOURSELF WITH KNOWLEDGE</h3>
              <p className="text-muted-foreground mb-6 text-pretty">
                Access our complete library of resources, join workshops, and connect with legal experts
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px] shadow-secondary transition-all duration-200 font-bold"
                >
                  BROWSE ALL RESOURCES
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px] shadow-secondary transition-all duration-200 font-bold bg-background"
                >
                  JOIN WORKSHOP
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
