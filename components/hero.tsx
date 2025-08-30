import { Button } from "@/components/ui/button"
import { ArrowRight, Scale } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-background border-b-8 border-secondary">
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="p-6 bg-primary border-4 border-secondary rounded-lg">
              <Scale className="w-16 h-16 text-primary-foreground" />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-black text-foreground mb-6 leading-none tracking-tight text-balance">
            JUSTICE
            <br />
            <span className="text-primary">STILL EXISTS</span>
          </h1>

          {/* Mission Statement */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed text-pretty">
            Empowering Indonesian citizens to voice their opinions, promote fairness, and build a more just society
            together.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6 border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[8px_8px_0px_0px] shadow-secondary transition-all duration-200 font-bold"
            >
              GET INVOLVED
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-4 border-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[8px_8px_0px_0px] shadow-secondary transition-all duration-200 font-bold bg-background"
            >
              LEARN MORE
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-accent border-4 border-secondary rotate-12 hidden md:block"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-primary border-4 border-secondary -rotate-12 hidden md:block"></div>
    </section>
  )
}
