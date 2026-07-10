import type { Metadata } from "next";

export const SITE_NAME = "Better Auth Studio";
export const SITE_DESCRIPTION =
  "An admin dashboard for Better Auth. Manage users, sessions, organizations, and more with an intuitive interface.";
export const SITE_URL = "https://www.better-auth.studio";

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
};

export function createPageMetadata({
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  path = "/",
}: PageMetadataOptions = {}): Metadata {
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
  const url = path.startsWith("http") ? path : `${SITE_URL}${path}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}/og.png`,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [`${SITE_URL}/og.png`],
    },
  };
}
