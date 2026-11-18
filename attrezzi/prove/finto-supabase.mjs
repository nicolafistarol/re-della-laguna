// finto supabase in memoria per provare server/index.ts
export const DB = { partite: [], giocatori: [], viste: [], azioni: [] };
let n = 0;
class Q {
  constructor(t) { this.t = t; this.f = []; this.op = "select"; this.one = 0; }
  select() { if (this.op === "select") this.op = "select"; this.ret = true; return this; }
  eq(k, v) { this.f.push((r) => r[k] === v); return this; }
  is(k, v) { this.f.push((r) => (r[k] ?? null) === v); return this; }
  order() { return this; } limit(n) { this.lim = n; return this; }
  single() { this.one = 1; return this; } maybeSingle() { this.one = 2; return this; }
  update(v) { this.op = "update"; this.val = v; return this; }
  insert(v) { this.op = "insert"; this.val = v; return this; }
  upsert(v) { this.op = "upsert"; this.val = v; return this; }
  then(res, rej) { try { res(this.run()); } catch (e) { rej(e); } }
  run() {
    const T = DB[this.t];
    if (this.op === "insert") { const rows = (Array.isArray(this.val) ? this.val : [this.val]).map((r) => ({ id: this.t === "partite" ? "p" + (++n) : undefined, in_corso: false, finita: false, versione: 0, bot: false, assente: false, uscito: false, visto_il: null, ...structuredClone(r) })); T.push(...rows); return { data: this.one ? rows[0] : rows, error: null }; }
    if (this.op === "upsert") { for (const r of this.val) { const i = T.findIndex((x) => x.partita_id === r.partita_id && x.player_id === r.player_id); if (i >= 0) T[i] = r; else T.push(r); } return { error: null }; }
    let rows = T.filter((r) => this.f.every((f) => f(r)));
    if (this.op === "update") { rows.forEach((r) => Object.assign(r, structuredClone(this.val))); return { data: rows.map((r) => ({ id: r.id })), error: null }; }
    rows = structuredClone(rows); if (this.lim) rows = rows.slice(0, this.lim);
    if (this.one) return { data: rows[0] ?? null, error: null };
    return { data: rows, error: null };
  }
}
export let UTENTE = { id: "u1" };
export function come(u) { UTENTE = { id: u }; }
export function createClient() { return { from: (t) => new Q(t), auth: { getUser: async () => ({ data: { user: UTENTE } }) } }; }
