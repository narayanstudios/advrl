import { useEffect } from 'react';
import AdvoraChrome from '../components/AdvoraChrome.jsx';
import Feed from '../components/Feed.jsx';
import { useLegacyStylesheet } from '../legacy/useLegacyStylesheet.js';
import { initMobileDebugger } from '../legacy/js/mobileDebugger.js';

export default function HomePage() {
  useLegacyStylesheet('/legacy/css/home.css');

  useEffect(() => {
    initMobileDebugger();
  }, []);

  return (
    <>
      <AdvoraChrome />
      <div className="main-layout">
        <main className="shell">
          <Feed />

          <aside className="rp">
            <div className="rp-header">
              <div className="rp-title">My Study Hub</div>
              <div className="rp-sub">Today's overview &amp; activity</div>
            </div>

            <div className="qb">
              <span className="ql">Quizzy — Daily Challenge</span>
              <div className="qtitle">Test your knowledge with today's challenge</div>
              <button className="qbtn">Start Quiz</button>
            </div>

            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon">🔥</div>
                <div className="stat-info">
                  <span className="stat-val">5 Days</span>
                  <span className="stat-lbl">Streak</span>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">⏱️</div>
                <div className="stat-info">
                  <span className="stat-val">12.5h</span>
                  <span className="stat-lbl">This Week</span>
                </div>
              </div>
            </div>

            <div className="widget" id="notifWidget">
              <div className="wh">
                <div className="wt">Notifications</div>
                <span style={{ fontSize: 10, background: 'var(--tp)', color: '#fff', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>3 new</span>
              </div>
              <div className="notif-item">
                <div className="notif-dot"></div>
                <div className="notif-body">
                  <div className="notif-text">Rahul Verma replied to your comment on <strong>DNA Replication post</strong></div>
                  <div className="notif-time">2 minutes ago</div>
                </div>
              </div>
              <div className="notif-item">
                <div className="notif-dot"></div>
                <div className="notif-body">
                  <div className="notif-text">Your quiz score ranked <strong>#4 on Leaderboard</strong> this week</div>
                  <div className="notif-time">1 hour ago</div>
                </div>
              </div>
              <div className="notif-item">
                <div className="notif-dot read"></div>
                <div className="notif-body">
                  <div className="notif-text"><strong>Dr. Priya Mehta</strong> uploaded a new chapter on Quantum Mechanics</div>
                  <div className="notif-time">3 hours ago</div>
                </div>
              </div>
            </div>

            <div className="widget" id="schedWidget">
              <div className="wh">
                <div className="wt">Schedule</div>
                <a className="see-all" href="#">See all</a>
              </div>
              <div className="sched-item">
                <span className="sched-time">9:00 AM</span>
                <div className="sched-meta">
                  <div className="sched-name">Physics Lecture</div>
                  <div className="sched-sub">Chapter 12 – Thermodynamics</div>
                </div>
              </div>
              <div className="sched-item">
                <span className="sched-time">11:30 AM</span>
                <div className="sched-meta">
                  <div className="sched-name">Math Practice</div>
                  <div className="sched-sub">Integration problems set</div>
                </div>
              </div>
              <div className="sched-item">
                <span className="sched-time">2:00 PM</span>
                <div className="sched-meta">
                  <div className="sched-name">Group Study</div>
                  <div className="sched-sub">Chemistry – Organic reactions</div>
                </div>
              </div>
            </div>

            <div className="widget" id="todoWidget">
              <div className="wh">
                <div className="wt">To Do</div>
                <a className="see-all" href="#">See all</a>
              </div>

              <label className="todo-item">
                <div className="todo-left">
                  <div className="custom-checkbox"><input type="checkbox" defaultChecked /><span className="checkmark"></span></div>
                  <span className="todo-text">Read Chapter 11 notes</span>
                </div>
                <span className="badge tag-physics">Physics</span>
              </label>

              <label className="todo-item">
                <div className="todo-left">
                  <div className="custom-checkbox"><input type="checkbox" /><span className="checkmark"></span></div>
                  <span className="todo-text">Solve 20 MCQs</span>
                </div>
                <span className="badge tag-math">Math</span>
              </label>

              <label className="todo-item">
                <div className="todo-left">
                  <div className="custom-checkbox"><input type="checkbox" /><span className="checkmark"></span></div>
                  <span className="todo-text">Submit assignment</span>
                </div>
                <span className="badge tag-chem">Chemistry</span>
              </label>

              <label className="todo-item">
                <div className="todo-left">
                  <div className="custom-checkbox"><input type="checkbox" /><span className="checkmark"></span></div>
                  <span className="todo-text">Watch lecture recap</span>
                </div>
                <span className="badge tag-bio">Biology</span>
              </label>
            </div>

            <div className="widget" id="crWidget" style={{ marginBottom: 30 }}>
              <div className="wh">
                <div className="wt">Continue Reading</div>
                <a className="see-all" href="#">See all</a>
              </div>
              <div className="read-item">
                <div className="read-thumb thumb-blue">QM</div>
                <div className="read-meta">
                  <div className="read-title">Quantum Mechanics Basics</div>
                  <div className="read-author">Dr. Priya Mehta</div>
                  <div className="read-bar-bg"><div className="read-bar-fill" style={{ width: '88%' }}></div></div>
                </div>
              </div>
              <div className="read-item">
                <div className="read-thumb thumb-purple">DNA</div>
                <div className="read-meta">
                  <div className="read-title">DNA Replication &amp; Errors</div>
                  <div className="read-author">Rahul Verma</div>
                  <div className="read-bar-bg"><div className="read-bar-fill" style={{ width: '32%' }}></div></div>
                </div>
              </div>
              <div className="read-item">
                <div className="read-thumb thumb-pink">CAL</div>
                <div className="read-meta">
                  <div className="read-title">Calculus – Limits &amp; Continuity</div>
                  <div className="read-author">Anjali Singh</div>
                  <div className="read-bar-bg"><div className="read-bar-fill" style={{ width: '85%' }}></div></div>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}
