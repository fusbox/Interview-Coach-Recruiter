import { Button } from "@/components/ui/button"

export default function ErrorScreen() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <h2 className="mb-2 text-xl font-bold text-destructive">Something went wrong</h2>
            <p className="mb-6 text-muted-foreground">We couldn&apos;t load your session.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
    )
}
