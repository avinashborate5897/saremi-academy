import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  type?: string;
  schema?: Record<string, any>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Saremi Academy - Live 1:1 Music Conservatory',
  description = 'Live 1:1 online music academy for Hindustani & Western Vocals, Piano, Guitar, and Tabla with integrated Riyaaz practice studio, maestro masterclasses, and certified diplomas.',
  canonicalPath = '/',
  type = 'website',
  schema
}) => {
  useEffect(() => {
    // Set document title
    const fullTitle = title.includes('Saremi Academy') ? title : `${title} | Saremi Academy`;
    document.title = fullTitle;

    // Set or update Meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', description);

    // Set or update OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', fullTitle);

    // Set or update OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description);

    // Canonical link
    const origin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://saremiacademy.online';
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${origin}${canonicalPath}`);

    // Schema.org Structured Data
    if (schema) {
      const existingScript = document.getElementById('saremi-page-schema');
      if (existingScript) {
        existingScript.textContent = JSON.stringify(schema);
      } else {
        const script = document.createElement('script');
        script.id = 'saremi-page-schema';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      }
    }

    return () => {
      // Cleanup custom schema on unmount if needed
    };
  }, [title, description, canonicalPath, type, schema]);

  return null;
};
