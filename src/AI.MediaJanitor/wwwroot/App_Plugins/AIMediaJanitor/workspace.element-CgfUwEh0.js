import { LitElement as fe, html as p, css as pe, state as v, customElement as be } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin as ye } from "@umbraco-cms/backoffice/element-api";
import { UMB_NOTIFICATION_CONTEXT as ge } from "@umbraco-cms/backoffice/notification";
import { umbHttpClient as me } from "@umbraco-cms/backoffice/http-client";
const _e = {
  bodySerializer: (e) => JSON.stringify(
    e,
    (t, s) => typeof s == "bigint" ? s.toString() : s
  )
}, we = ({
  onRequest: e,
  onSseError: t,
  onSseEvent: s,
  responseTransformer: r,
  responseValidator: a,
  sseDefaultRetryDelay: l,
  sseMaxRetryAttempts: n,
  sseMaxRetryDelay: o,
  sseSleepFn: u,
  url: d,
  ...i
}) => {
  let h;
  const T = u ?? ((c) => new Promise((y) => setTimeout(y, c)));
  return { stream: async function* () {
    let c = l ?? 3e3, y = 0;
    const z = i.signal ?? new AbortController().signal;
    for (; !z.aborted; ) {
      y++;
      const O = i.headers instanceof Headers ? i.headers : new Headers(i.headers);
      h !== void 0 && O.set("Last-Event-ID", h);
      try {
        const E = {
          redirect: "follow",
          ...i,
          body: i.serializedBody,
          headers: O,
          signal: z
        };
        let k = new Request(d, E);
        e && (k = await e(d, E));
        const g = await (i.fetch ?? globalThis.fetch)(k);
        if (!g.ok)
          throw new Error(
            `SSE failed: ${g.status} ${g.statusText}`
          );
        if (!g.body) throw new Error("No body in SSE response");
        const $ = g.body.pipeThrough(new TextDecoderStream()).getReader();
        let q = "";
        const L = () => {
          try {
            $.cancel();
          } catch {
          }
        };
        z.addEventListener("abort", L);
        try {
          for (; ; ) {
            const { done: ue, value: ce } = await $.read();
            if (ue) break;
            q += ce;
            const F = q.split(`

`);
            q = F.pop() ?? "";
            for (const de of F) {
              const he = de.split(`
`), N = [];
              let V;
              for (const _ of he)
                if (_.startsWith("data:"))
                  N.push(_.replace(/^data:\s*/, ""));
                else if (_.startsWith("event:"))
                  V = _.replace(/^event:\s*/, "");
                else if (_.startsWith("id:"))
                  h = _.replace(/^id:\s*/, "");
                else if (_.startsWith("retry:")) {
                  const G = Number.parseInt(
                    _.replace(/^retry:\s*/, ""),
                    10
                  );
                  Number.isNaN(G) || (c = G);
                }
              let C, J = !1;
              if (N.length) {
                const _ = N.join(`
`);
                try {
                  C = JSON.parse(_), J = !0;
                } catch {
                  C = _;
                }
              }
              J && (a && await a(C), r && (C = await r(C))), s?.({
                data: C,
                event: V,
                id: h,
                retry: c
              }), N.length && (yield C);
            }
          }
        } finally {
          z.removeEventListener("abort", L), $.releaseLock();
        }
        break;
      } catch (E) {
        if (t?.(E), n !== void 0 && y >= n)
          break;
        const k = Math.min(
          c * 2 ** (y - 1),
          o ?? 3e4
        );
        await T(k);
      }
    }
  }() };
}, ke = (e) => {
  switch (e) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, $e = (e) => {
  switch (e) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
}, Ae = (e) => {
  switch (e) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, Z = ({
  allowReserved: e,
  explode: t,
  name: s,
  style: r,
  value: a
}) => {
  if (!t) {
    const o = (e ? a : a.map((u) => encodeURIComponent(u))).join($e(r));
    switch (r) {
      case "label":
        return `.${o}`;
      case "matrix":
        return `;${s}=${o}`;
      case "simple":
        return o;
      default:
        return `${s}=${o}`;
    }
  }
  const l = ke(r), n = a.map((o) => r === "label" || r === "simple" ? e ? o : encodeURIComponent(o) : P({
    allowReserved: e,
    name: s,
    value: o
  })).join(l);
  return r === "label" || r === "matrix" ? l + n : n;
}, P = ({
  allowReserved: e,
  name: t,
  value: s
}) => {
  if (s == null)
    return "";
  if (typeof s == "object")
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these."
    );
  return `${t}=${e ? s : encodeURIComponent(s)}`;
}, ee = ({
  allowReserved: e,
  explode: t,
  name: s,
  style: r,
  value: a,
  valueOnly: l
}) => {
  if (a instanceof Date)
    return l ? a.toISOString() : `${s}=${a.toISOString()}`;
  if (r !== "deepObject" && !t) {
    let u = [];
    Object.entries(a).forEach(([i, h]) => {
      u = [
        ...u,
        i,
        e ? h : encodeURIComponent(h)
      ];
    });
    const d = u.join(",");
    switch (r) {
      case "form":
        return `${s}=${d}`;
      case "label":
        return `.${d}`;
      case "matrix":
        return `;${s}=${d}`;
      default:
        return d;
    }
  }
  const n = Ae(r), o = Object.entries(a).map(
    ([u, d]) => P({
      allowReserved: e,
      name: r === "deepObject" ? `${s}[${u}]` : u,
      value: d
    })
  ).join(n);
  return r === "label" || r === "matrix" ? n + o : o;
}, ve = /\{[^{}]+\}/g, xe = ({ path: e, url: t }) => {
  let s = t;
  const r = t.match(ve);
  if (r)
    for (const a of r) {
      let l = !1, n = a.substring(1, a.length - 1), o = "simple";
      n.endsWith("*") && (l = !0, n = n.substring(0, n.length - 1)), n.startsWith(".") ? (n = n.substring(1), o = "label") : n.startsWith(";") && (n = n.substring(1), o = "matrix");
      const u = e[n];
      if (u == null)
        continue;
      if (Array.isArray(u)) {
        s = s.replace(
          a,
          Z({ explode: l, name: n, style: o, value: u })
        );
        continue;
      }
      if (typeof u == "object") {
        s = s.replace(
          a,
          ee({
            explode: l,
            name: n,
            style: o,
            value: u,
            valueOnly: !0
          })
        );
        continue;
      }
      if (o === "matrix") {
        s = s.replace(
          a,
          `;${P({
            name: n,
            value: u
          })}`
        );
        continue;
      }
      const d = encodeURIComponent(
        o === "label" ? `.${u}` : u
      );
      s = s.replace(a, d);
    }
  return s;
}, Se = ({
  baseUrl: e,
  path: t,
  query: s,
  querySerializer: r,
  url: a
}) => {
  const l = a.startsWith("/") ? a : `/${a}`;
  let n = (e ?? "") + l;
  t && (n = xe({ path: t, url: n }));
  let o = s ? r(s) : "";
  return o.startsWith("?") && (o = o.substring(1)), o && (n += `?${o}`), n;
};
function ze(e) {
  const t = e.body !== void 0;
  if (t && e.bodySerializer)
    return "serializedBody" in e ? e.serializedBody !== void 0 && e.serializedBody !== "" ? e.serializedBody : null : e.body !== "" ? e.body : null;
  if (t)
    return e.body;
}
const Ee = async (e, t) => {
  const s = typeof t == "function" ? await t(e) : t;
  if (s)
    return e.scheme === "bearer" ? `Bearer ${s}` : e.scheme === "basic" ? `Basic ${btoa(s)}` : s;
}, te = ({
  allowReserved: e,
  array: t,
  object: s
} = {}) => (a) => {
  const l = [];
  if (a && typeof a == "object")
    for (const n in a) {
      const o = a[n];
      if (o != null)
        if (Array.isArray(o)) {
          const u = Z({
            allowReserved: e,
            explode: !0,
            name: n,
            style: "form",
            value: o,
            ...t
          });
          u && l.push(u);
        } else if (typeof o == "object") {
          const u = ee({
            allowReserved: e,
            explode: !0,
            name: n,
            style: "deepObject",
            value: o,
            ...s
          });
          u && l.push(u);
        } else {
          const u = P({
            allowReserved: e,
            name: n,
            value: o
          });
          u && l.push(u);
        }
    }
  return l.join("&");
}, Ce = (e) => {
  if (!e)
    return "stream";
  const t = e.split(";")[0]?.trim();
  if (t) {
    if (t.startsWith("application/json") || t.endsWith("+json"))
      return "json";
    if (t === "multipart/form-data")
      return "formData";
    if (["application/", "audio/", "image/", "video/"].some(
      (s) => t.startsWith(s)
    ))
      return "blob";
    if (t.startsWith("text/"))
      return "text";
  }
}, Te = (e, t) => t ? !!(e.headers.has(t) || e.query?.[t] || e.headers.get("Cookie")?.includes(`${t}=`)) : !1, Oe = async ({
  security: e,
  ...t
}) => {
  for (const s of e) {
    if (Te(t, s.name))
      continue;
    const r = await Ee(s, t.auth);
    if (!r)
      continue;
    const a = s.name ?? "Authorization";
    switch (s.in) {
      case "query":
        t.query || (t.query = {}), t.query[a] = r;
        break;
      case "cookie":
        t.headers.append("Cookie", `${a}=${r}`);
        break;
      default:
        t.headers.set(a, r);
        break;
    }
  }
}, Q = (e) => Se({
  baseUrl: e.baseUrl,
  path: e.path,
  query: e.query,
  querySerializer: typeof e.querySerializer == "function" ? e.querySerializer : te(e.querySerializer),
  url: e.url
}), Y = (e, t) => {
  const s = { ...e, ...t };
  return s.baseUrl?.endsWith("/") && (s.baseUrl = s.baseUrl.substring(0, s.baseUrl.length - 1)), s.headers = se(e.headers, t.headers), s;
}, je = (e) => {
  const t = [];
  return e.forEach((s, r) => {
    t.push([r, s]);
  }), t;
}, se = (...e) => {
  const t = new Headers();
  for (const s of e) {
    if (!s)
      continue;
    const r = s instanceof Headers ? je(s) : Object.entries(s);
    for (const [a, l] of r)
      if (l === null)
        t.delete(a);
      else if (Array.isArray(l))
        for (const n of l)
          t.append(a, n);
      else l !== void 0 && t.set(
        a,
        typeof l == "object" ? JSON.stringify(l) : l
      );
  }
  return t;
};
class R {
  constructor() {
    this.fns = [];
  }
  clear() {
    this.fns = [];
  }
  eject(t) {
    const s = this.getInterceptorIndex(t);
    this.fns[s] && (this.fns[s] = null);
  }
  exists(t) {
    const s = this.getInterceptorIndex(t);
    return !!this.fns[s];
  }
  getInterceptorIndex(t) {
    return typeof t == "number" ? this.fns[t] ? t : -1 : this.fns.indexOf(t);
  }
  update(t, s) {
    const r = this.getInterceptorIndex(t);
    return this.fns[r] ? (this.fns[r] = s, t) : !1;
  }
  use(t) {
    return this.fns.push(t), this.fns.length - 1;
  }
}
const Ie = () => ({
  error: new R(),
  request: new R(),
  response: new R()
}), Ne = te({
  allowReserved: !1,
  array: {
    explode: !0,
    style: "form"
  },
  object: {
    explode: !0,
    style: "deepObject"
  }
}), Pe = {
  "Content-Type": "application/json"
}, ae = (e = {}) => ({
  ..._e,
  headers: Pe,
  parseAs: "auto",
  querySerializer: Ne,
  ...e
}), qe = (e = {}) => {
  let t = Y(ae(), e);
  const s = () => ({ ...t }), r = (d) => (t = Y(t, d), s()), a = Ie(), l = async (d) => {
    const i = {
      ...t,
      ...d,
      fetch: d.fetch ?? t.fetch ?? globalThis.fetch,
      headers: se(t.headers, d.headers),
      serializedBody: void 0
    };
    i.security && await Oe({
      ...i,
      security: i.security
    }), i.requestValidator && await i.requestValidator(i), i.body !== void 0 && i.bodySerializer && (i.serializedBody = i.bodySerializer(i.body)), (i.body === void 0 || i.serializedBody === "") && i.headers.delete("Content-Type");
    const h = Q(i);
    return { opts: i, url: h };
  }, n = async (d) => {
    const { opts: i, url: h } = await l(d), T = {
      redirect: "follow",
      ...i,
      body: ze(i)
    };
    let x = new Request(h, T);
    for (const f of a.request.fns)
      f && (x = await f(x, i));
    const I = i.fetch;
    let c = await I(x);
    for (const f of a.response.fns)
      f && (c = await f(c, x, i));
    const y = {
      request: x,
      response: c
    };
    if (c.ok) {
      const f = (i.parseAs === "auto" ? Ce(c.headers.get("Content-Type")) : i.parseAs) ?? "json";
      if (c.status === 204 || c.headers.get("Content-Length") === "0") {
        let $;
        switch (f) {
          case "arrayBuffer":
          case "blob":
          case "text":
            $ = await c[f]();
            break;
          case "formData":
            $ = new FormData();
            break;
          case "stream":
            $ = c.body;
            break;
          default:
            $ = {};
            break;
        }
        return i.responseStyle === "data" ? $ : {
          data: $,
          ...y
        };
      }
      let g;
      switch (f) {
        case "arrayBuffer":
        case "blob":
        case "formData":
        case "json":
        case "text":
          g = await c[f]();
          break;
        case "stream":
          return i.responseStyle === "data" ? c.body : {
            data: c.body,
            ...y
          };
      }
      return f === "json" && (i.responseValidator && await i.responseValidator(g), i.responseTransformer && (g = await i.responseTransformer(g))), i.responseStyle === "data" ? g : {
        data: g,
        ...y
      };
    }
    const z = await c.text();
    let O;
    try {
      O = JSON.parse(z);
    } catch {
    }
    const E = O ?? z;
    let k = E;
    for (const f of a.error.fns)
      f && (k = await f(E, c, x, i));
    if (k = k || {}, i.throwOnError)
      throw k;
    return i.responseStyle === "data" ? void 0 : {
      error: k,
      ...y
    };
  }, o = (d) => (i) => n({ ...i, method: d }), u = (d) => async (i) => {
    const { opts: h, url: T } = await l(i);
    return we({
      ...h,
      body: h.body,
      headers: h.headers,
      method: d,
      onRequest: async (x, I) => {
        let c = new Request(x, I);
        for (const y of a.request.fns)
          y && (c = await y(c, h));
        return c;
      },
      url: T
    });
  };
  return {
    buildUrl: Q,
    connect: o("CONNECT"),
    delete: o("DELETE"),
    get: o("GET"),
    getConfig: s,
    head: o("HEAD"),
    interceptors: a,
    options: o("OPTIONS"),
    patch: o("PATCH"),
    post: o("POST"),
    put: o("PUT"),
    request: n,
    setConfig: r,
    sse: {
      connect: u("CONNECT"),
      delete: u("DELETE"),
      get: u("GET"),
      head: u("HEAD"),
      options: u("OPTIONS"),
      patch: u("PATCH"),
      post: u("POST"),
      put: u("PUT"),
      trace: u("TRACE")
    },
    trace: o("TRACE")
  };
}, Re = (e) => ({
  ...e,
  ...me.getConfig()
}), W = qe(Re(ae({
  baseUrl: "https://localhost:44333"
})));
var Be = Object.defineProperty, Ue = Object.getOwnPropertyDescriptor, re = (e) => {
  throw TypeError(e);
}, w = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Ue(t, s) : t, l = e.length - 1, n; l >= 0; l--)
    (n = e[l]) && (a = (r ? n(t, s, a) : n(a)) || a);
  return r && a && Be(t, s, a), a;
}, D = (e, t, s) => t.has(e) || re("Cannot " + s), j = (e, t, s) => (D(e, t, "read from private field"), s ? s.call(e) : t.get(e)), X = (e, t, s) => t.has(e) ? re("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, s), We = (e, t, s, r) => (D(e, t, "write to private field"), t.set(e, s), s), A = (e, t, s) => (D(e, t, "access private method"), s), S, m, B, M, ie, ne, oe, le, U;
const H = "/umbraco/aimediajanitor/api/v1", K = [{ scheme: "bearer", type: "http" }], De = 2;
let b = class extends ye(fe) {
  constructor() {
    super(), X(this, m), this._missingAlt = !0, this._poorName = !0, this._loading = !1, this._candidates = [], this._suggestions = /* @__PURE__ */ new Map(), this._busyKeys = /* @__PURE__ */ new Set(), this._bulkRunning = !1, this._bulkProgress = 0, this._bulkTotal = 0, X(this, S), this.consumeContext(ge, (e) => {
      We(this, S, e);
    });
  }
  connectedCallback() {
    super.connectedCallback(), A(this, m, B).call(this);
  }
  // -- render ------------------------------------------------------------
  render() {
    const e = this._suggestions.size, t = this._candidates.length;
    return p`
      <umb-body-layout headline="AI Media Assistant">
        <uui-box headline="Find images to review" class="filters">
          <p class="muted">
            Click <b>Analyse all images</b> to run AI suggestions across every
            image listed below. Review the table, then apply per row.
          </p>

          <div class="filter-row">
            <uui-toggle
              label="Missing alt text"
              ?checked=${this._missingAlt}
              @change=${(s) => {
      this._missingAlt = s.target.checked;
    }}
            ></uui-toggle>
            <uui-toggle
              label="Poor / generic name"
              ?checked=${this._poorName}
              @change=${(s) => {
      this._poorName = s.target.checked;
    }}
            ></uui-toggle>
            <uui-button look="secondary" @click=${() => A(this, m, B).call(this)}>
              Refresh list
            </uui-button>
            <uui-button
              look="primary"
              color="positive"
              ?disabled=${this._bulkRunning || t === 0}
              @click=${() => A(this, m, ie).call(this)}
            >
              ${this._bulkRunning ? `Analysing ${this._bulkProgress} / ${this._bulkTotal}…` : `Analyse all images (${t})`}
            </uui-button>
            <span class="muted small"
              >${e} of ${t} analysed</span
            >
          </div>

          ${this._bulkRunning ? p`<uui-loader-bar></uui-loader-bar>` : null}
          ${this._error ? p`<p class="error">${this._error}</p>` : null}
        </uui-box>

        ${this._loading ? p`<uui-loader></uui-loader>` : this._candidates.length === 0 ? p`<uui-box
                ><p>No images need attention with the current filters.</p></uui-box
              >` : A(this, m, oe).call(this)}
      </umb-body-layout>
    `;
  }
};
S = /* @__PURE__ */ new WeakMap();
m = /* @__PURE__ */ new WeakSet();
B = async function() {
  this._loading = !0, this._error = void 0;
  try {
    const { data: e, error: t, response: s } = await W.get({
      url: `${H}/candidates`,
      security: K,
      query: {
        missingAlt: this._missingAlt,
        poorName: this._poorName,
        skip: 0,
        take: 50
      }
    });
    if (t || !e)
      throw new Error(`Failed to load candidates (${s.status})`);
    this._candidates = e.items;
    const r = new Set(e.items.map((l) => l.key)), a = /* @__PURE__ */ new Map();
    for (const [l, n] of this._suggestions)
      r.has(l) && a.set(l, n);
    this._suggestions = a;
  } catch (e) {
    this._error = e.message;
  } finally {
    this._loading = !1;
  }
};
M = async function(e) {
  const t = new Set(this._busyKeys);
  t.add(e), this._busyKeys = t;
  try {
    const { data: s, error: r, response: a } = await W.post({
      url: `${H}/analyze`,
      security: K,
      body: { mediaKey: e }
    });
    if (r || !s)
      throw new Error(`Analyze failed (${a.status})`);
    const l = new Map(this._suggestions);
    l.set(e, s), this._suggestions = l;
  } catch (s) {
    j(this, S)?.peek("danger", {
      data: { headline: "Analyze failed", message: s.message }
    });
  } finally {
    const s = new Set(this._busyKeys);
    s.delete(e), this._busyKeys = s;
  }
};
ie = async function() {
  if (this._candidates.length === 0 || this._bulkRunning) return;
  this._bulkRunning = !0, this._bulkProgress = 0, this._bulkTotal = this._candidates.length;
  const e = [...this._candidates], t = Array.from({ length: De }, async () => {
    for (; e.length > 0; ) {
      const s = e.shift();
      if (!s) return;
      await A(this, m, M).call(this, s.key), this._bulkProgress = this._bulkProgress + 1;
    }
  });
  try {
    await Promise.all(t), j(this, S)?.peek("positive", {
      data: {
        headline: "Analysis complete",
        message: `Analysed ${this._bulkTotal} item${this._bulkTotal === 1 ? "" : "s"}.`
      }
    });
  } finally {
    this._bulkRunning = !1;
  }
};
ne = async function(e) {
  const t = this._suggestions.get(e);
  if (!t) return;
  const s = { mediaKey: e };
  if (t.name && (s.name = t.name), t.altText && (s.altText = t.altText), t.caption && (s.caption = t.caption), Object.keys(s).length === 1) {
    j(this, S)?.peek("warning", {
      data: { headline: "Nothing to apply", message: "The suggestion is empty for this item." }
    });
    return;
  }
  const r = new Set(this._busyKeys);
  r.add(e), this._busyKeys = r;
  try {
    const { error: a, response: l } = await W.post({
      url: `${H}/apply`,
      security: K,
      body: s
    });
    if (a)
      throw new Error(`Apply failed (${l.status})`);
    j(this, S)?.peek("positive", {
      data: {
        headline: "Applied",
        message: `Updated ${t.name ?? "media item"}`
      }
    }), this._candidates = this._candidates.filter((o) => o.key !== e);
    const n = new Map(this._suggestions);
    n.delete(e), this._suggestions = n;
  } catch (a) {
    j(this, S)?.peek("danger", {
      data: { headline: "Apply failed", message: a.message }
    });
  } finally {
    const a = new Set(this._busyKeys);
    a.delete(e), this._busyKeys = a;
  }
};
oe = function() {
  return p`
      <uui-box headline="Media files that need attention">
        <uui-table>
          <uui-table-head>
            <uui-table-head-cell>File</uui-table-head-cell>
            <uui-table-head-cell>Issues</uui-table-head-cell>
            <uui-table-head-cell>Current alt</uui-table-head-cell>
            <uui-table-head-cell>Suggested name</uui-table-head-cell>
            <uui-table-head-cell>Suggested alt</uui-table-head-cell>
            <uui-table-head-cell>Caption</uui-table-head-cell>
            <uui-table-head-cell>Confidence</uui-table-head-cell>
            <uui-table-head-cell>Actions</uui-table-head-cell>
          </uui-table-head>
          ${this._candidates.map((e) => A(this, m, le).call(this, e))}
        </uui-table>
      </uui-box>
    `;
};
le = function(e) {
  const t = this._suggestions.get(e.key), s = this._busyKeys.has(e.key);
  return p`
      <uui-table-row class=${s ? "row-busy" : ""}>
        <uui-table-cell>
          <div class="file-cell">
            <strong title=${e.name}>${e.name}</strong>
            <span class="muted small" title=${e.folderPath ?? "/"}
              >${e.folderPath ?? "/"}</span
            >
          </div>
        </uui-table-cell>
        <uui-table-cell>
          <div class="tags">
            ${e.missingAlt ? p`<uui-tag color="danger" look="primary" size="s">no alt</uui-tag>` : null}
            ${e.poorName ? p`<uui-tag color="warning" look="primary" size="s"
                  >generic name</uui-tag
                >` : null}
          </div>
        </uui-table-cell>
        <uui-table-cell>
          <span class=${e.currentAltText ? "" : "muted"}
            >${e.currentAltText ?? "—"}</span
          >
        </uui-table-cell>
        <uui-table-cell>
          ${A(this, m, U).call(this, t?.name, e.name)}
        </uui-table-cell>
        <uui-table-cell>
          ${A(this, m, U).call(this, t?.altText, e.currentAltText ?? "")}
        </uui-table-cell>
        <uui-table-cell>
          <span class=${t?.caption ? "" : "muted"}>${t?.caption ?? "—"}</span>
        </uui-table-cell>
        <uui-table-cell>
          ${t ? t.uncertain ? p`<uui-tag color="warning" size="s" title=${t.note ?? ""}
                  >uncertain</uui-tag
                >` : p`<uui-tag color="positive" size="s">ok</uui-tag>` : p`<span class="muted">—</span>`}
        </uui-table-cell>
        <uui-table-cell>
          <div class="actions">
            <uui-button
              size="s"
              look="secondary"
              ?disabled=${s || this._bulkRunning}
              @click=${() => A(this, m, M).call(this, e.key)}
            >
              ${t ? "Re-analyse" : "Analyse"}
            </uui-button>
            <uui-button
              size="s"
              look="primary"
              color="positive"
              ?disabled=${s || !t}
              @click=${() => A(this, m, ne).call(this, e.key)}
            >
              Apply
            </uui-button>
            ${s ? p`<uui-loader-circle></uui-loader-circle>` : null}
          </div>
        </uui-table-cell>
      </uui-table-row>
    `;
};
U = function(e, t) {
  return e ? p`
      <code class=${e !== t ? "diff" : ""}>${e}</code>
    ` : p`<span class="muted">—</span>`;
};
b.styles = [
  pe`
      :host {
        display: block;
      }

      .filters {
        margin-bottom: var(--uui-size-layout-1);
      }
      .filter-row {
        display: flex;
        gap: var(--uui-size-space-3);
        align-items: center;
        flex-wrap: wrap;
      }

      .file-cell {
        display: grid;
        gap: 2px;
      }
      .tags {
        display: flex;
        gap: var(--uui-size-space-1);
        flex-wrap: wrap;
      }
      .actions {
        display: flex;
        gap: var(--uui-size-space-2);
        align-items: center;
      }

      code {
        background: var(--uui-color-surface-alt);
        padding: 2px 6px;
        border-radius: 4px;
        word-break: break-word;
        font-size: 0.85em;
      }
      code.diff {
        background: var(--uui-color-positive-emphasis);
        color: var(--uui-color-positive-contrast);
      }

      .row-busy {
        opacity: 0.6;
      }

      .muted {
        color: var(--uui-color-text-alt);
      }
      .small {
        font-size: 12px;
      }
      .error {
        color: var(--uui-color-danger);
      }
    `
];
w([
  v()
], b.prototype, "_missingAlt", 2);
w([
  v()
], b.prototype, "_poorName", 2);
w([
  v()
], b.prototype, "_loading", 2);
w([
  v()
], b.prototype, "_candidates", 2);
w([
  v()
], b.prototype, "_suggestions", 2);
w([
  v()
], b.prototype, "_busyKeys", 2);
w([
  v()
], b.prototype, "_bulkRunning", 2);
w([
  v()
], b.prototype, "_bulkProgress", 2);
w([
  v()
], b.prototype, "_bulkTotal", 2);
w([
  v()
], b.prototype, "_error", 2);
b = w([
  be("ai-media-assistant-workspace")
], b);
const Fe = b;
export {
  b as AIMediaAssistantWorkspaceElement,
  Fe as default
};
//# sourceMappingURL=workspace.element-CgfUwEh0.js.map
