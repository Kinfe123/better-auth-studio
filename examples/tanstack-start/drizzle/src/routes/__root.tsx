import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { Header } from "@/components/header"
import { Providers } from "@/components/providers"
import appCss from "../styles/styles.css?url"

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { title: "Better Auth Starter" },
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1"
            },
            {
                name: "theme-color",
                content: "var(--bg-background)"
            }
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss
            }
        ]
    }),

    shellComponent: RootDocument
})

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>

            <body className="min-h-screen flex flex-col">
                <Providers>
                    <Header />

                    {children}
                </Providers>

                <TanStackDevtools
                    config={{
                        position: "bottom-right"
                    }}
                    plugins={[
                        {
                            name: "Tanstack Router",
                            render: <TanStackRouterDevtoolsPanel />
                        }
                    ]}
                />

                <Scripts />
            </body>
        </html>
    )
}
