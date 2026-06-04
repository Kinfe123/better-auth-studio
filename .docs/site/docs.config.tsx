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
      "slug": "features",
      "children": [
        {
          "slug": "organization-management"
        }
      ]
    },
    {
      "slug": "configuration",
      "children": [
        {
          "slug": "database-adapters"
        },
        {
          "slug": "deployment"
        }
      ]
    },
    {
      "slug": "guides",
      "children": [
        {
          "slug": "watch-mode"
        }
      ]
    },
    {
      "slug": "self-hosting",
      "children": [
        {
          "slug": "overview"
        }
      ]
    }
  ],
  metadata: {
    titleTemplate: "%s – Docs",
    description: "Managed by @farming-labs/docs Cloud",
  },
});
