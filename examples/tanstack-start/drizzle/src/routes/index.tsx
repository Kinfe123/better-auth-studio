import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: IndexPage })

function IndexPage() {
    return (
        <main className="container mx-auto flex flex-col gap-4 p-6">
            <h1 className="text-2xl font-bold">Hello, world.</h1>
        </main>
    )
}
