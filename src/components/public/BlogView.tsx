import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { Clock, Calendar, User, ArrowRight, Share2, BookOpen } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { ACADEMY_BLOG, BlogPostItem } from '../../data/academyData';
import { SEOHead } from '../SEOHead';

interface BlogViewProps {
  slug?: string;
  onOpenBooking: () => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ slug, onOpenBooking }) => {
  const { navigate } = useRouter();

  // -------------------------------------------------------------
  // DETAIL SUBVIEW: /blog/:slug
  // -------------------------------------------------------------
  if (slug) {
    const post = ACADEMY_BLOG.find(p => p.slug === slug) || ACADEMY_BLOG[0];

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "author": {
        "@type": "Person",
        "name": post.author.name
      },
      "datePublished": post.date,
      "image": post.image
    };

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-left space-y-8">
        <SEOHead
          title={post.title}
          description={post.excerpt}
          canonicalPath={`/blog/${post.slug}`}
          schema={articleSchema}
        />

        <button
          onClick={() => navigate('/blog')}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
        >
          ← Back to Conservatory Journal
        </button>

        {/* Article Header */}
        <div className="space-y-4">
          <Badge variant="brass">{post.category}</Badge>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#121829] leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-11 h-11 rounded-full object-cover border border-[#D49A3D]"
            />
            <div className="text-xs">
              <strong className="block text-gray-900 font-bold">{post.author.name}</strong>
              <span className="text-gray-500">{post.author.role} • {post.date} • {post.readTime}</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="rounded-3xl overflow-hidden shadow-md aspect-16/9">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        {/* Article Body */}
        <div className="space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed font-sans max-w-prose">
          {post.content.map((paragraph, idx) => (
            <p key={idx} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Bottom CTA Box */}
        <Card variant="default" padding="lg" className="bg-[#FAF8F5] border-[#D49A3D] space-y-4">
          <h3 className="font-serif text-xl font-bold text-[#121829]">
            Put These Principles Into 1:1 Practice
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Reading theory is inspiring; experiencing diagnostic correction transforms your sound forever. Book a complimentary 45-minute live diagnostic trial with our gurus.
          </p>
          <Button variant="brass" size="md" onClick={onOpenBooking}>
            Book Free Diagnostic Trial
          </Button>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LIST OVERVIEW: /blog
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-10">
      <SEOHead
        title="Conservatory Journal & Music Pedagogy"
        description="Essays on vocal anatomy, Kharaj riyaaz discipline, piano biomechanics, Indian tala geometry, and musical mindfulness by Saremi gurus."
        canonicalPath="/blog"
      />

      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="brass">The Conservatory Journal</Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#121829]">
          Insights from the Tradition
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          In-depth essays on vocal anatomy, piano ergonomics, rhythmic geometry, and musical meditation by our faculty and visiting scholars.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ACADEMY_BLOG.map(post => (
          <Card
            key={post.slug}
            variant="interactive"
            padding="none"
            className="overflow-hidden flex flex-col justify-between"
            onClick={() => navigate(`/blog/${post.slug}`)}
          >
            <div>
              <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <Badge variant="brass" size="sm">{post.category}</Badge>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#121829] leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">{post.date}</span>
              <span className="text-xs font-bold text-[#8C6428] flex items-center gap-1">
                Read Article →
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
