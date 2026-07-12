import { useEffect, useRef } from 'react';
import { createHomeFeedController } from '../legacy/js/feed-engine.js';

// Same markup as the <section class="feed"> block in home.html, including
// the two skeleton-loader <article class="card"> placeholders that show
// before the first page of posts arrives. Once mounted, feed-engine.js
// takes over this container exactly like the original feed.js did with
// document.querySelector('.feed') — clearing the skeletons and rendering
// real PostCards, tabs, infinite scroll, and pull-to-refresh.
export default function Feed() {
  const feedRef = useRef(null);
  const fhRef = useRef(null);

  useEffect(() => {
    const controller = createHomeFeedController(feedRef.current, fhRef.current);
    return () => controller.destroy();
  }, []);

  return (
    <section className="feed" ref={feedRef}>
      <div className="fh" ref={fhRef}>
        <span className="ft">For You</span>
        <div className="tabs">
          <button className="tab active">All</button>
          <button className="tab">Following</button>
          <button className="tab">Trending</button>
          <button className="tab">New</button>
        </div>
      </div>

      <article className="card">
        <div className="ch"><div className="av sk"></div><div className="hm"><div className="sk skt"></div><div className="sk sks"></div></div><div className="sk skd"></div></div>
        <div className="sk img-sk"></div>
        <div className="cl"><div className="sk skl1"></div><div className="sk skl2"></div><div className="sk skl3"></div></div>
      </article>

      <article className="card">
        <div className="ch"><div className="av sk"></div><div className="hm"><div className="sk skt" style={{ width: '42%' }}></div><div className="sk sks" style={{ width: '25%' }}></div></div><div className="sk skd"></div></div>
        <div className="sk img-sk" style={{ aspectRatio: '16/7' }}></div>
        <div className="cl"><div className="sk skl1" style={{ width: '60%' }}></div><div className="sk skl2" style={{ width: '82%' }}></div><div className="sk skl3" style={{ width: '75%' }}></div></div>
      </article>
    </section>
  );
}
