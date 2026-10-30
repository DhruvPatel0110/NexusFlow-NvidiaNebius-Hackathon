import React from 'react';
import { FileText, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import useDashboardStore from '../state/dashboardStore';

// Curated high-resolution imagery for disruption categories
const CATEGORY_IMAGES = {
  shipping: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
  port: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
  geopolitical: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
  weather: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=400&q=80',
  natural_disaster: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=400&q=80',
  pipeline: 'https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=400&q=80',
  energy: 'https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=400&q=80',
  strike: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
  industrial: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
  automotive: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
  semiconductor: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
};

// Fallback curated events matching the target visual design
const DEFAULT_EVENTS = [
  {
    article_id: 'default-1',
    title: 'Red Sea Shipping Disruptions Intensify After New Attacks',
    content_snippet: 'Multiple vessels rerouting, longer transit times expected.',
    disruption_type: 'geopolitical',
    severity: 'High Impact',
    severityColor: 'bg-red-500',
    timeAgo: '2h ago',
    image: CATEGORY_IMAGES.shipping,
    tags: ['Shipping', 'Middle East', 'Global Trade'],
  },
  {
    article_id: 'default-2',
    title: 'Typhoon Halong Disrupts East Asia Port Operations',
    content_snippet: 'Operations suspended at major ports in Taiwan and Philippines.',
    disruption_type: 'natural_disaster',
    severity: 'Medium Impact',
    severityColor: 'bg-orange-500',
    timeAgo: '4h ago',
    image: CATEGORY_IMAGES.weather,
    tags: ['Weather', 'East Asia', 'Port Operations'],
  },
  {
    article_id: 'default-3',
    title: 'Natural Gas Pipeline Maintenance Increases Supply Uncertainty',
    content_snippet: 'Scheduled maintenance may affect regional gas supplies.',
    disruption_type: 'commodity_crisis',
    severity: 'Medium Impact',
    severityColor: 'bg-orange-500',
    timeAgo: '6h ago',
    image: CATEGORY_IMAGES.pipeline,
    tags: ['Energy', 'Europe', 'Natural Gas'],
  },
  {
    article_id: 'default-4',
    title: 'Labor Strikes Continue at German Automotive Plants',
    content_snippet: 'Production delays expected in coming weeks.',
    disruption_type: 'industrial_failure',
    severity: 'Low Impact',
    severityColor: 'bg-yellow-400',
    timeAgo: '8h ago',
    image: CATEGORY_IMAGES.strike,
    tags: ['Manufacturing', 'Europe', 'Automotive'],
  },
];

export default function LatestEventsPanel() {
  const articles = useDashboardStore((state) => state.articles);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const setSelectedEvent = useDashboardStore((state) => state.setSelectedEvent);

  // Map real backend articles to event cards
  const displayEvents = React.useMemo(() => {
    if (!articles || articles.length === 0) {
      return DEFAULT_EVENTS;
    }

    return articles.slice(0, 8).map((article, index) => {
      const type = (article.disruption_type || article.event_category || 'logistics').toLowerCase();
      
      // Determine image based on content keywords
      let image = CATEGORY_IMAGES.shipping;
      const text = `${article.title} ${article.content_snippet || ''}`.toLowerCase();
      if (text.includes('typhoon') || text.includes('weather') || text.includes('storm')) image = CATEGORY_IMAGES.weather;
      else if (text.includes('pipeline') || text.includes('gas') || text.includes('oil')) image = CATEGORY_IMAGES.pipeline;
      else if (text.includes('strike') || text.includes('plant') || text.includes('automotive')) image = CATEGORY_IMAGES.strike;
      else if (text.includes('chip') || text.includes('semiconductor')) image = CATEGORY_IMAGES.semiconductor;

      // Severity calculation
      const score = article.relevance_score || article.confidence || 0.8;
      let severity = 'Medium Impact';
      let severityColor = 'bg-orange-500';
      if (score >= 0.9) {
        severity = 'High Impact';
        severityColor = 'bg-red-500';
      } else if (score < 0.7) {
        severity = 'Low Impact';
        severityColor = 'bg-yellow-400';
      }

      // Generate tags
      const tags = [];
      if (article.disruption_type) tags.push(article.disruption_type.replace('_', ' '));
      if (article.primary_commodities?.length > 0) tags.push(article.primary_commodities[0]);
      if (article.all_entities?.locations?.length > 0) tags.push(article.all_entities.locations[0]);
      if (tags.length === 0) tags.push('Supply Chain', 'Global Trade');

      // Relative timestamp calculation
      let timeAgo = `${(index + 1) * 2}h ago`;
      if (article.published_at) {
        const diffMs = Date.now() - new Date(article.published_at).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours > 0 && diffHours < 72) timeAgo = `${diffHours}h ago`;
      }

      return {
        ...article,
        severity,
        severityColor,
        timeAgo,
        image,
        tags: tags.slice(0, 3),
      };
    });
  }, [articles]);

  return (
    <div className="bg-[#895129] rounded-2xl p-5 text-white border border-[#9E6237]/40 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-white" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Latest Events
          </h2>
        </div>
        <button
          onClick={() => setActiveTab('events')}
          className="text-xs text-[#EAE0D1] hover:text-white flex items-center gap-1 font-medium transition-colors group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Events Scrollable List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 max-h-[780px]">
        {displayEvents.map((event) => (
          <div
            key={event.article_id}
            onClick={() => setSelectedEvent(event)}
            className="bg-[#70401D] hover:bg-[#7D4721] rounded-xl p-3 border border-white/10 transition-all cursor-pointer group shadow-xs hover:border-white/25"
          >
            {/* Thumbnail Image */}
            <div className="w-full h-32 rounded-lg overflow-hidden mb-3 relative bg-black/20">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = CATEGORY_IMAGES.shipping;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>

            {/* Severity Dot & Time */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${event.severityColor}`} />
                <span className="text-[11px] font-bold tracking-wide text-white">
                  {event.severity}
                </span>
              </div>
              <span className="text-[11px] text-[#D8CBBA]">
                {event.timeAgo}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-1 group-hover:text-amber-200 transition-colors">
              {event.title}
            </h3>

            {/* Summary */}
            <p className="text-xs text-[#EAE0D1] line-clamp-2 leading-relaxed mb-3">
              {event.content_snippet || event.description || 'Disruption analysis underway.'}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-[#5D3315] text-[#F0E6D8] text-[10px] px-2 py-0.5 rounded-md font-medium border border-white/5 capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

