import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-4 border-emerald-400 bg-zinc-800 shadow-[8px_8px_0px_0px_theme(colors.emerald.400)]">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-black text-emerald-400 uppercase tracking-wider">BERHASIL!</CardTitle>
            <CardDescription className="text-zinc-300 font-bold">Akun Anda telah dibuat</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-emerald-400 border-2 border-emerald-600 p-4 text-zinc-900 font-bold">
              <p className="text-lg">Selamat datang, pejuang keadilan!</p>
              <p className="text-sm mt-2">Silakan cek email Anda untuk konfirmasi akun sebelum masuk.</p>
            </div>
            <div className="space-y-4">
              <p className="text-zinc-300 font-bold">
                Anda mendapat 1000 poin untuk mulai berpartisipasi dalam voting!
              </p>
              <Link href="/auth/login">
                <Button className="w-full bg-emerald-400 hover:bg-emerald-500 text-zinc-900 font-black text-lg uppercase tracking-wider h-14 border-2 border-emerald-600 shadow-[4px_4px_0px_0px_theme(colors.emerald.600)] hover:shadow-[2px_2px_0px_0px_theme(colors.emerald.600)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  MASUK SEKARANG
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
