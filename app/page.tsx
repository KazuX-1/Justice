import { Hero } from "@/components/hero"
import { VotingSystem } from "@/components/voting-system"
import { ForumPreview } from "@/components/forum-preview"
import { CitizenReporting } from "@/components/citizen-reporting"
import { DonationSection } from "@/components/donation-section"
import { JusticeIndex } from "@/components/justice-index"
import { EducationHub } from "@/components/education-hub"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <VotingSystem />
      {/* <ForumPreview /> */}
      {/* <CitizenReporting /> */}
      <DonationSection />
      <JusticeIndex />
      {/* <EducationHub /> */}
    </main>
  )
}
