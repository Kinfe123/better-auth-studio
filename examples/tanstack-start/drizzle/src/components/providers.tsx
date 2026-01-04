import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { Link, useRouter } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"

import { authClient } from "@/lib/auth-client"
import { MetaTheme } from "./meta-theme"

export function Providers({ children }: { children: React.ReactNode }) {
    const { navigate } = useRouter()

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthUIProvider
                authClient={authClient}
                navigate={(href) => navigate({ href })}
                replace={(href) => navigate({ href, replace: true })}
                Link={({ href, ...props }) => <Link to={href} {...props} />}
            >
                {children}

                <MetaTheme />
            </AuthUIProvider>
        </ThemeProvider>
    )
}
