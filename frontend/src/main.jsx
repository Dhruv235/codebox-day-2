import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'];
const emptyPlayer = { player_name: '', team: '', position: 'QB', notes: '', status: 'watching' };

async function api(path, method = 'GET', body) {
  const response = await fetch(`/api/${path}`, {
    method, credentials: 'same-origin',
    headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : {},
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { status: response.status });
  return data;
}

function Brand() {
  return <a className="brand" href="/app/" aria-label="Sideline home"><span className="brand-icon">S</span>SIDELINE<span className="brand-caption">NFL WATCHLIST</span></a>;
}

function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState('sign-in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPlayer);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function report(error) {
    setError(error.message || 'Unable to reach the server. Please try again.');
    if (error.status === 401) { setUser(null); setPlayers([]); setEditing(null); setDeleteTarget(null); }
  }

  async function loadPlayers() {
    setLoading(true); setLoadFailed(false);
    try { setPlayers((await api('watchlist')).data); }
    catch (error) { setLoadFailed(true); report(error); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    api('session').then(data => setUser(data.user)).catch(error => {
      if (error.status !== 401) report(error);
    }).finally(() => setBooting(false));
  }, []);

  useEffect(() => { if (user) loadPlayers(); }, [user?.id]);

  useEffect(() => {
    if (!editing && !deleteTarget) return;
    const background = [...document.querySelectorAll('header, main, footer')];
    background.forEach(element => { element.inert = true; });
    function keys(event) {
      if (event.key === 'Escape' && !busy) { setEditing(null); setDeleteTarget(null); }
      if (event.key !== 'Tab') return;
      const focusable = [...document.querySelectorAll('[role="dialog"] button:not(:disabled), [role="dialog"] input, [role="dialog"] select, [role="dialog"] textarea')];
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', keys);
    return () => { background.forEach(element => { element.inert = false; }); document.removeEventListener('keydown', keys); };
  }, [editing, deleteTarget, busy]);

  async function authenticate(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const fields = new FormData(event.currentTarget);
    try {
      const data = await api(`session/${authMode}`, 'POST', { email: fields.get('email'), password: fields.get('password') });
      if (data.user) setUser(data.user);
      else { setNotice(data.message); setAuthMode('sign-in'); }
    } catch (error) { report(error); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setError('');
    try { await api('session/sign-out', 'POST', {}); setUser(null); setPlayers([]); setNotice('You have signed out.'); }
    catch (error) { report(error); }
    finally { setBusy(false); }
  }

  function openEditor(player = null) {
    setForm(player ? Object.fromEntries(Object.keys(emptyPlayer).map(key => [key, player[key]])) : { ...emptyPlayer });
    setEditing(player?.id || 'new'); setError(''); setNotice('');
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const data = await api(editing === 'new' ? 'watchlist' : `watchlist/${editing}`, editing === 'new' ? 'POST' : 'PATCH', form);
      setPlayers(previous => editing === 'new' ? [data.data, ...previous] : previous.map(player => player.id === editing ? data.data : player));
      setNotice(editing === 'new' ? 'Player added to your watchlist.' : 'Player updated.'); setEditing(null);
    } catch (error) { report(error); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError('');
    try {
      await api(`watchlist/${deleteTarget.id}`, 'DELETE', {});
      setPlayers(previous => previous.filter(player => player.id !== deleteTarget.id));
      setDeleteTarget(null); setNotice('Player removed from your watchlist.');
    } catch (error) { report(error); }
    finally { setBusy(false); }
  }

  const visible = players.filter(player => (filter === 'all' || player.status === filter) &&
    `${player.player_name} ${player.team} ${player.position}`.toLowerCase().includes(search.toLowerCase()));
  const alerts = <>{error && <div className="message error" role="alert">{error}</div>}{notice && <div className="message success" role="status">{notice}</div>}</>;

  return <div className="shell">
    <header><Brand /><div className="header-right"><span className="private-label">YOUR PERSONAL SCOUTING BOARD</span>{user && <button className="quiet" disabled={busy} onClick={signOut}>Sign out</button>}</div></header>
    {booting ? <main className="loading" role="status">Opening your playbook…</main> : !user ?
      <main className="landing">
        <section className="intro">
          <div className="eyebrow"><span /> FOR THE FANS WHO TAKE NOTES</div>
          <h1>Your players.<br />Your perspective.<br /><em>Your sideline.</em></h1>
          <p>Keep an eye on the players that catch yours. Build a personal NFL watchlist, save your scouting notes, and keep your favorites close.</p>
          <div className="field-art" aria-hidden="true"><div className="field-mark">10</div><div className="field-mark">20</div><div className="field-mark">30</div><div className="field-mark">40</div><span className="route-dot" /><span className="field-caption">EVERY GREAT PICK STARTS WITH A NOTE.</span></div>
        </section>
        <section className="auth-panel">
          <div className="small-label">WELCOME TO SIDELINE</div>
          <h2>{authMode === 'sign-in' ? 'Back in the game.' : 'Build your board.'}</h2>
          <p>{authMode === 'sign-in' ? 'Sign in to your personal watchlist.' : 'Create an account to save your players.'}</p>
          {alerts}
          <form onSubmit={authenticate}>
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /></label>
            <label>Password<input name="password" type="password" autoComplete={authMode === 'sign-in' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" required minLength={8} maxLength={128} /></label>
            <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : authMode === 'sign-in' ? 'Sign in →' : 'Create account →'}</button>
          </form>
          <p className="switch-auth">{authMode === 'sign-in' ? 'New to the sideline?' : 'Already have an account?'} <button className="text-button" disabled={busy} onClick={() => { setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setNotice(''); }}>{authMode === 'sign-in' ? 'Create account' : 'Sign in'}</button></p>
          <div className="auth-foot">Private to you. Ready for game day.</div>
        </section>
      </main> : <main className="board">
        <div className="board-title"><div><div className="eyebrow">THE PERSONAL SCOUTING REPORT</div><h1>Your watchlist<span>.</span></h1><p>Follow the talent. Keep your own take.</p></div><button className="primary" disabled={busy || loading || loadFailed} onClick={() => openEditor()}>＋ Add player</button></div>
        {!editing && !deleteTarget && alerts}
        <section className="stats" aria-label="Watchlist summary"><div><span>ON YOUR RADAR</span><strong>{loading ? '—' : players.length}</strong></div><div><span>FAVORITES</span><strong>{loading ? '—' : players.filter(p => p.status === 'favorite').length}</strong></div><div><span>TEAMS FOLLOWED</span><strong>{loading ? '—' : new Set(players.map(p => p.team.toLowerCase())).size}</strong></div><div className="stat-note">Your board.<br /><em>Your call.</em></div></section>
        <div className="toolbar"><div className="filters" aria-label="Filter players">{[['all', 'All players'], ['watching', 'Watching'], ['favorite', 'Favorites']].map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><input className="search" aria-label="Search players" placeholder="Search player, team, position…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {loading ? <div className="empty" role="status">Loading your players…</div> : loadFailed ? <div className="empty"><h2>Couldn’t load your board.</h2><p>Your saved players have not been changed.</p><button className="primary" onClick={() => { setError(''); loadPlayers(); }}>Try again</button></div> : visible.length ? <section className="players" aria-label="Your players">{visible.map((player, i) => <article className="player" key={player.id}><div className="player-top"><span className="position">{player.position}</span><span className={`status ${player.status}`}>{player.status === 'favorite' ? '★ Favorite' : '◉ Watching'}</span></div><div className="player-index">{String(i + 1).padStart(2, '0')}</div><h2>{player.player_name}</h2><p className="team">{player.team}</p><div className="notes"><span>SCOUTING NOTES</span><p>{player.notes || 'No notes yet. What stands out to you?'}</p></div><div className="player-actions"><button onClick={() => openEditor(player)} disabled={busy} aria-label={`Edit ${player.player_name}`}>Edit player ↗</button><button className="delete-button" onClick={() => { setDeleteTarget(player); setError(''); setNotice(''); }} disabled={busy} aria-label={`Remove ${player.player_name}`}>Remove</button></div></article>)}</section> : <div className="empty"><div className="empty-number">01</div><h2>{players.length ? 'No players match that search.' : 'Every watchlist starts with one player.'}</h2><p>{players.length ? 'Try another name or filter.' : 'Add a player, jot down your take, and make this board yours.'}</p>{!players.length && <button className="primary" onClick={() => openEditor()}>Add your first player →</button>}</div>}
        <div className="board-footer"><span>Signed in as {user.email}</span><span>Personal notes. No live stats feed.</span></div>
      </main>}
    {editing && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div className="modal-heading"><div><div className="small-label">YOUR SCOUTING BOARD</div><h2 id="editor-title">{editing === 'new' ? 'Add a player' : 'Edit player'}</h2></div><button className="quiet" aria-label="Close player form" disabled={busy} onClick={() => setEditing(null)}>✕</button></div>{alerts}<form onSubmit={save}><label>Player name<input autoFocus required maxLength={80} value={form.player_name} onChange={e => setForm({ ...form, player_name: e.target.value })} placeholder="Player name" /></label><label>Team<input required maxLength={80} value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} placeholder="Team name" /></label><div className="form-row"><label>Position<select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>{positions.map(p => <option key={p}>{p}</option>)}</select></label><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="watching">Watching</option><option value="favorite">Favorite</option></select></label></div><label>Scouting notes<textarea rows={4} maxLength={1000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="What caught your attention?" /></label><button className="primary full" disabled={busy}>{busy ? 'Saving…' : 'Save player'}</button></form></section></div>}
    {deleteTarget && <div className="modal-backdrop"><section className="modal compact" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Remove {deleteTarget.player_name}?</h2><p>This removes the player and their notes from your watchlist.</p>{alerts}<div className="confirm-actions"><button autoFocus className="quiet" disabled={busy} onClick={() => setDeleteTarget(null)}>Keep player</button><button className="danger" disabled={busy} onClick={remove}>{busy ? 'Removing…' : 'Remove player'}</button></div></section></div>}
    <footer><span>SIDELINE / CODEBOX</span><span>An independent NFL fan project.</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
