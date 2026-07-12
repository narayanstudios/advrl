import { useEffect, useRef } from 'react';
import PostCard from './PostCard.jsx';
import { attachCardInteractions } from '../legacy/js/feed-engine.js';

/**
 * Required-change per the migration brief: the Profile page must render
 * posts with the exact same PostCard used on Home, instead of its old
 * Instagram-style thumbnail grid. Interactions (like/save/share/menu/
 * image viewer) are wired the same way Home does it — one delegated
 * listener on the container, shared logic, no duplicated code.
 */
export default function ProfilePostsList({ posts }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const detach = attachCardInteractions(containerRef.current);
    return detach;
  }, []);

  if (!posts.length) {
    return (
      <div className="p-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 12h8M8 16h5" /><path d="M8 8h3" /></svg>
        <div className="p-empty-title">No Posts Yet</div>
        <div className="p-empty-sub">Share your first study post.</div>
      </div>
    );
  }

  return (
    <div className="p-posts-feed" ref={containerRef}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
