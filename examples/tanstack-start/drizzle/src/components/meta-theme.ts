import { useEffect } from "react"

export function MetaTheme() {
    useEffect(() => {
        const updateThemeColor = () => {
            const bgColor = window.getComputedStyle(
                document.body
            ).backgroundColor

            const metaThemeColor = document.querySelector(
                "meta[name=theme-color]"
            )

            metaThemeColor?.setAttribute("content", bgColor)
        }

        const observer = new MutationObserver(updateThemeColor)

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"]
        })

        return () => observer.disconnect()
    }, [])

    return null
}
