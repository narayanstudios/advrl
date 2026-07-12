import { useEffect, useRef } from 'react';
import { buildPostCard } from '../legacy/js/feed-engine.js';

/**
 * The one shared PostCard component, used by both the Home feed and the
 * Profile "Posts" tab (per the migration brief's required change).
 *
 * It doesn't re-implement the card in JSX: it calls the exact same
 * `buildPostCard(post)` DOM builder from feed-engine.js (itself unchanged
 * from the original feed.js) and mounts that node directly. That guarantees
 * pixel- and behavior-identical cards everywhere, with a single source of
 * truth for the markup.
 *
 * Click/like/save/share/menu interactions are wired at the list-container
 * level (see Feed.jsx and ProfilePostsList.jsx) via attachCardInteractions,
 * matching the original event-delegation design instead of per-card
 * listeners.
 */
export default function PostCard({ post }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const node = buildPostCard(post);
    host.appendChild(node);
    return () => {
      node.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  return <div className="post-card-host" ref={hostRef} />;
}
