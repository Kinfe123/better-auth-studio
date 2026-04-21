import { defineDocs } from "@farming-labs/docs";
import { colorful } from "@farming-labs/theme/colorful";

export default defineDocs({
  entry: "docs",
  theme: colorful(),
  ordering: [
    {
      "slug": "quickstart"
    },
    {
      "slug": "installation"
    },
    {
      "slug": "adapters",
      "children": [
        {
          "slug": "astro"
        },
        {
          "slug": "elysia"
        },
        {
          "slug": "express"
        },
        {
          "slug": "hono"
        },
        {
          "slug": "nextjs"
        },
        {
          "slug": "nuxt"
        },
        {
          "slug": "remix"
        },
        {
          "slug": "solid-start"
        },
        {
          "slug": "svelte-kit"
        },
        {
          "slug": "tanstack-start"
        }
      ]
    },
    {
      "slug": "features",
      "children": [
        {
          "slug": "dashboard-overview"
        },
        {
          "slug": "developer-tools"
        },
        {
          "slug": "event-tracking"
        },
        {
          "slug": "organization-management"
        },
        {
          "slug": "session-management"
        },
        {
          "slug": "user-management"
        }
      ]
    },
    {
      "slug": "self-hosting",
      "children": [
        {
          "slug": "astro"
        },
        {
          "slug": "elysia"
        },
        {
          "slug": "express"
        },
        {
          "slug": "hono"
        },
        {
          "slug": "nextjs"
        },
        {
          "slug": "nuxt"
        },
        {
          "slug": "overview"
        },
        {
          "slug": "remix"
        },
        {
          "slug": "solid-start"
        },
        {
          "slug": "svelte-kit"
        },
        {
          "slug": "tanstack-start"
        }
      ]
    },
    {
      "slug": "configuration",
      "children": [
        {
          "slug": "access-control"
        },
        {
          "slug": "database-adapters"
        },
        {
          "slug": "database"
        },
        {
          "slug": "deployment"
        },
        {
          "slug": "environment"
        },
        {
          "slug": "event-ingestion"
        },
        {
          "slug": "ip-geolocation"
        },
        {
          "slug": "metadata"
        }
      ]
    },
    {
      "slug": "guides",
      "children": [
        {
          "slug": "bulk-operations"
        },
        {
          "slug": "cli-usage"
        },
        {
          "slug": "custom-branding"
        },
        {
          "slug": "troubleshooting"
        },
        {
          "slug": "watch-mode"
        }
      ]
    },
    {
      "slug": "examples",
      "children": [
        {
          "slug": "astro"
        },
        {
          "slug": "elysia"
        },
        {
          "slug": "express"
        },
        {
          "slug": "hono"
        },
        {
          "slug": "nextjs"
        },
        {
          "slug": "nuxt"
        },
        {
          "slug": "remix"
        },
        {
          "slug": "solid-start"
        },
        {
          "slug": "svelte-kit"
        },
        {
          "slug": "tanstack-start"
        }
      ]
    },
    {
      "slug": "api",
      "children": [
        {
          "slug": "adapters",
          "children": [
            {
              "slug": "astro"
            },
            {
              "slug": "elysia"
            },
            {
              "slug": "express"
            },
            {
              "slug": "hono"
            },
            {
              "slug": "nextjs"
            },
            {
              "slug": "nuxt"
            },
            {
              "slug": "remix"
            },
            {
              "slug": "solid-start"
            },
            {
              "slug": "svelte-kit"
            },
            {
              "slug": "tanstack-start"
            }
          ]
        },
        {
          "slug": "cli",
          "children": [
            {
              "slug": "init"
            },
            {
              "slug": "start"
            }
          ]
        },
        {
          "slug": "config",
          "children": [
            {
              "slug": "access-config"
            },
            {
              "slug": "events-config"
            },
            {
              "slug": "metadata-config"
            },
            {
              "slug": "studio-config"
            }
          ]
        },
        {
          "slug": "events",
          "children": [
            {
              "slug": "providers"
            }
          ]
        },
        {
          "slug": "exports"
        },
        {
          "slug": "utilities",
          "children": [
            {
              "slug": "access-rules"
            },
            {
              "slug": "database-detection"
            },
            {
              "slug": "event-ingestion"
            },
            {
              "slug": "hook-injector"
            }
          ]
        }
      ]
    },
    {
      "slug": "access-rules"
    },
    {
      "slug": "auth-adapter"
    },
    {
      "slug": "cli",
      "children": [
        {
          "slug": "commands"
        }
      ]
    },
    {
      "slug": "config"
    },
    {
      "slug": "core",
      "children": [
        {
          "slug": "handlers"
        }
      ]
    },
    {
      "slug": "data"
    },
    {
      "slug": "database-detection"
    },
    {
      "slug": "dist"
    },
    {
      "slug": "event-ingestion"
    },
    {
      "slug": "events"
    },
    {
      "slug": "frontend",
      "children": [
        {
          "slug": "src"
        }
      ]
    },
    {
      "slug": "geo-service"
    },
    {
      "slug": "get-tsconfig-info"
    },
    {
      "slug": "handlers"
    },
    {
      "slug": "hook-injector"
    },
    {
      "slug": "html-injector"
    },
    {
      "slug": "org-hooks-injector"
    },
    {
      "slug": "providers",
      "children": [
        {
          "slug": "events"
        }
      ]
    },
    {
      "slug": "routes",
      "children": [
        {
          "slug": "api-router"
        }
      ]
    },
    {
      "slug": "session"
    }
  ],
  metadata: {
    titleTemplate: "%s – Docs",
    description: "Generated by @farming-labs/docs Cloud",
  },
});
