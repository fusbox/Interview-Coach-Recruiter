import { Button } from "@/components/ui/button"
import { CheckCircle, RotateCcw } from "lucide-react"
import { useSession } from "@/context/SessionContext"

export default function SummaryScreen() {
    const { resetSession } = useSession();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center space-y-8 max-w-lg w-full">

                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Session Complete!</h1>
                    <p className="text-muted-foreground">
                        Great job practicing. You can review your answers and the coach's feedback in your dashboard.
                    </p>
                </div>

                <div className="pt-4">
                    <Button size="lg" className="w-full gap-2" variant="outline" onClick={() => resetSession()}>
                        <RotateCcw className="w-4 h-4" /> Practice Again
                    </Button>
                </div>
            </div>
        </div>
    )
}
