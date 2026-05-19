import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useCurrentPageMetadata, getPageTitle, getMetaDescription } from '@/hooks/usePageMetadata';

const DynamicSEO: React.FC = () => {
  const { data: metadata } = useCurrentPageMetadata();

  const title = getPageTitle(metadata);
  const description = getMetaDescription(metadata);
  const ogTitle = metadata?.og_title || title;
  const ogDescription = metadata?.og_description || description;
  const keywords = metadata?.meta_keywords || '';
  const canonical = metadata?.canonical_url || '';

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
};

export default DynamicSEO;
