import { Loader2 } from "lucide-react"

export default function LoadingScreen() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <p className="text-muted-foreground font-medium">Loading session...</p>
            </div>
        </div>
    )
}
