import { Helmet } from "react-helmet-async";

const SITE = "https://careerdecoder.work";

interface SEOProps {
  title: string;
  description?: string;
  path: string;
  jsonLd?: object;
  /** OpenGraph object type — use "article" for blog posts and editorial guides. */
  ogType?: "website" | "article";
  /** Absolute https URL of the social preview image. */
  image?: string;
  /** ISO date of publication (article only). */
  publishedTime?: string;
  /** ISO date of last modification (article only). */
  modifiedTime?: string;
}

export const SEO = ({
  title,
  description,
  path,
  jsonLd,
  ogType = "website",
  image,
  publishedTime,
  modifiedTime,
}: SEOProps) => {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Career Decoder" />
      {image && <meta property="og:image" content={image} />}
      {ogType === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};
