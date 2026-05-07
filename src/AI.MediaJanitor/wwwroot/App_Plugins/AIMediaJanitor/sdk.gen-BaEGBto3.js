import { umbHttpClient as _ } from "@umbraco-cms/backoffice/http-client";
const G = {
  bodySerializer: (t) => JSON.stringify(
    t,
    (e, r) => typeof r == "bigint" ? r.toString() : r
  )
}, Q = ({
  onRequest: t,
  onSseError: e,
  onSseEvent: r,
  responseTransformer: o,
  responseValidator: n,
  sseDefaultRetryDelay: l,
  sseMaxRetryAttempts: c,
  sseMaxRetryDelay: s,
  sseSleepFn: i,
  url: f,
  ...a
}) => {
  let d;
  const E = i ?? ((u) => new Promise((y) => setTimeout(y, u)));
  return { stream: async function* () {
    let u = l ?? 3e3, y = 0;
    const S = a.signal ?? new AbortController().signal;
    for (; !S.aborted; ) {
      y++;
      const x = a.headers instanceof Headers ? a.headers : new Headers(a.headers);
      d !== void 0 && x.set("Last-Event-ID", d);
      try {
        const j = {
          redirect: "follow",
          ...a,
          body: a.serializedBody,
          headers: x,
          signal: S
        };
        let m = new Request(f, j);
        t && (m = await t(f, j));
        const p = await (a.fetch ?? globalThis.fetch)(m);
        if (!p.ok)
          throw new Error(
            `SSE failed: ${p.status} ${p.statusText}`
          );
        if (!p.body) throw new Error("No body in SSE response");
        const g = p.body.pipeThrough(new TextDecoderStream()).getReader();
        let I = "";
        const $ = () => {
          try {
            g.cancel();
          } catch {
          }
        };
        S.addEventListener("abort", $);
        try {
          for (; ; ) {
            const { done: L, value: M } = await g.read();
            if (L) break;
            I += M;
            const k = I.split(`

`);
            I = k.pop() ?? "";
            for (const J of k) {
              const F = J.split(`
`), T = [];
              let v;
              for (const b of F)
                if (b.startsWith("data:"))
                  T.push(b.replace(/^data:\s*/, ""));
                else if (b.startsWith("event:"))
                  v = b.replace(/^event:\s*/, "");
                else if (b.startsWith("id:"))
                  d = b.replace(/^id:\s*/, "");
                else if (b.startsWith("retry:")) {
                  const N = Number.parseInt(
                    b.replace(/^retry:\s*/, ""),
                    10
                  );
                  Number.isNaN(N) || (u = N);
                }
              let z, B = !1;
              if (T.length) {
                const b = T.join(`
`);
                try {
                  z = JSON.parse(b), B = !0;
                } catch {
                  z = b;
                }
              }
              B && (n && await n(z), o && (z = await o(z))), r?.({
                data: z,
                event: v,
                id: d,
                retry: u
              }), T.length && (yield z);
            }
          }
        } finally {
          S.removeEventListener("abort", $), g.releaseLock();
        }
        break;
      } catch (j) {
        if (e?.(j), c !== void 0 && y >= c)
          break;
        const m = Math.min(
          u * 2 ** (y - 1),
          s ?? 3e4
        );
        await E(m);
      }
    }
  }() };
}, K = (t) => {
  switch (t) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, X = (t) => {
  switch (t) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
}, Y = (t) => {
  switch (t) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, U = ({
  allowReserved: t,
  explode: e,
  name: r,
  style: o,
  value: n
}) => {
  if (!e) {
    const s = (t ? n : n.map((i) => encodeURIComponent(i))).join(X(o));
    switch (o) {
      case "label":
        return `.${s}`;
      case "matrix":
        return `;${r}=${s}`;
      case "simple":
        return s;
      default:
        return `${r}=${s}`;
    }
  }
  const l = K(o), c = n.map((s) => o === "label" || o === "simple" ? t ? s : encodeURIComponent(s) : q({
    allowReserved: t,
    name: r,
    value: s
  })).join(l);
  return o === "label" || o === "matrix" ? l + c : c;
}, q = ({
  allowReserved: t,
  name: e,
  value: r
}) => {
  if (r == null)
    return "";
  if (typeof r == "object")
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these."
    );
  return `${e}=${t ? r : encodeURIComponent(r)}`;
}, W = ({
  allowReserved: t,
  explode: e,
  name: r,
  style: o,
  value: n,
  valueOnly: l
}) => {
  if (n instanceof Date)
    return l ? n.toISOString() : `${r}=${n.toISOString()}`;
  if (o !== "deepObject" && !e) {
    let i = [];
    Object.entries(n).forEach(([a, d]) => {
      i = [
        ...i,
        a,
        t ? d : encodeURIComponent(d)
      ];
    });
    const f = i.join(",");
    switch (o) {
      case "form":
        return `${r}=${f}`;
      case "label":
        return `.${f}`;
      case "matrix":
        return `;${r}=${f}`;
      default:
        return f;
    }
  }
  const c = Y(o), s = Object.entries(n).map(
    ([i, f]) => q({
      allowReserved: t,
      name: o === "deepObject" ? `${r}[${i}]` : i,
      value: f
    })
  ).join(c);
  return o === "label" || o === "matrix" ? c + s : s;
}, Z = /\{[^{}]+\}/g, ee = ({ path: t, url: e }) => {
  let r = e;
  const o = e.match(Z);
  if (o)
    for (const n of o) {
      let l = !1, c = n.substring(1, n.length - 1), s = "simple";
      c.endsWith("*") && (l = !0, c = c.substring(0, c.length - 1)), c.startsWith(".") ? (c = c.substring(1), s = "label") : c.startsWith(";") && (c = c.substring(1), s = "matrix");
      const i = t[c];
      if (i == null)
        continue;
      if (Array.isArray(i)) {
        r = r.replace(
          n,
          U({ explode: l, name: c, style: s, value: i })
        );
        continue;
      }
      if (typeof i == "object") {
        r = r.replace(
          n,
          W({
            explode: l,
            name: c,
            style: s,
            value: i,
            valueOnly: !0
          })
        );
        continue;
      }
      if (s === "matrix") {
        r = r.replace(
          n,
          `;${q({
            name: c,
            value: i
          })}`
        );
        continue;
      }
      const f = encodeURIComponent(
        s === "label" ? `.${i}` : i
      );
      r = r.replace(n, f);
    }
  return r;
}, te = ({
  baseUrl: t,
  path: e,
  query: r,
  querySerializer: o,
  url: n
}) => {
  const l = n.startsWith("/") ? n : `/${n}`;
  let c = (t ?? "") + l;
  e && (c = ee({ path: e, url: c }));
  let s = r ? o(r) : "";
  return s.startsWith("?") && (s = s.substring(1)), s && (c += `?${s}`), c;
};
function re(t) {
  const e = t.body !== void 0;
  if (e && t.bodySerializer)
    return "serializedBody" in t ? t.serializedBody !== void 0 && t.serializedBody !== "" ? t.serializedBody : null : t.body !== "" ? t.body : null;
  if (e)
    return t.body;
}
const ae = async (t, e) => {
  const r = typeof e == "function" ? await e(t) : e;
  if (r)
    return t.scheme === "bearer" ? `Bearer ${r}` : t.scheme === "basic" ? `Basic ${btoa(r)}` : r;
}, H = ({
  allowReserved: t,
  array: e,
  object: r
} = {}) => (n) => {
  const l = [];
  if (n && typeof n == "object")
    for (const c in n) {
      const s = n[c];
      if (s != null)
        if (Array.isArray(s)) {
          const i = U({
            allowReserved: t,
            explode: !0,
            name: c,
            style: "form",
            value: s,
            ...e
          });
          i && l.push(i);
        } else if (typeof s == "object") {
          const i = W({
            allowReserved: t,
            explode: !0,
            name: c,
            style: "deepObject",
            value: s,
            ...r
          });
          i && l.push(i);
        } else {
          const i = q({
            allowReserved: t,
            name: c,
            value: s
          });
          i && l.push(i);
        }
    }
  return l.join("&");
}, se = (t) => {
  if (!t)
    return "stream";
  const e = t.split(";")[0]?.trim();
  if (e) {
    if (e.startsWith("application/json") || e.endsWith("+json"))
      return "json";
    if (e === "multipart/form-data")
      return "formData";
    if (["application/", "audio/", "image/", "video/"].some(
      (r) => e.startsWith(r)
    ))
      return "blob";
    if (e.startsWith("text/"))
      return "text";
  }
}, ne = (t, e) => e ? !!(t.headers.has(e) || t.query?.[e] || t.headers.get("Cookie")?.includes(`${e}=`)) : !1, ie = async ({
  security: t,
  ...e
}) => {
  for (const r of t) {
    if (ne(e, r.name))
      continue;
    const o = await ae(r, e.auth);
    if (!o)
      continue;
    const n = r.name ?? "Authorization";
    switch (r.in) {
      case "query":
        e.query || (e.query = {}), e.query[n] = o;
        break;
      case "cookie":
        e.headers.append("Cookie", `${n}=${o}`);
        break;
      default:
        e.headers.set(n, o);
        break;
    }
  }
}, D = (t) => te({
  baseUrl: t.baseUrl,
  path: t.path,
  query: t.query,
  querySerializer: typeof t.querySerializer == "function" ? t.querySerializer : H(t.querySerializer),
  url: t.url
}), P = (t, e) => {
  const r = { ...t, ...e };
  return r.baseUrl?.endsWith("/") && (r.baseUrl = r.baseUrl.substring(0, r.baseUrl.length - 1)), r.headers = R(t.headers, e.headers), r;
}, oe = (t) => {
  const e = [];
  return t.forEach((r, o) => {
    e.push([o, r]);
  }), e;
}, R = (...t) => {
  const e = new Headers();
  for (const r of t) {
    if (!r)
      continue;
    const o = r instanceof Headers ? oe(r) : Object.entries(r);
    for (const [n, l] of o)
      if (l === null)
        e.delete(n);
      else if (Array.isArray(l))
        for (const c of l)
          e.append(n, c);
      else l !== void 0 && e.set(
        n,
        typeof l == "object" ? JSON.stringify(l) : l
      );
  }
  return e;
};
class O {
  constructor() {
    this.fns = [];
  }
  clear() {
    this.fns = [];
  }
  eject(e) {
    const r = this.getInterceptorIndex(e);
    this.fns[r] && (this.fns[r] = null);
  }
  exists(e) {
    const r = this.getInterceptorIndex(e);
    return !!this.fns[r];
  }
  getInterceptorIndex(e) {
    return typeof e == "number" ? this.fns[e] ? e : -1 : this.fns.indexOf(e);
  }
  update(e, r) {
    const o = this.getInterceptorIndex(e);
    return this.fns[o] ? (this.fns[o] = r, e) : !1;
  }
  use(e) {
    return this.fns.push(e), this.fns.length - 1;
  }
}
const ce = () => ({
  error: new O(),
  request: new O(),
  response: new O()
}), le = H({
  allowReserved: !1,
  array: {
    explode: !0,
    style: "form"
  },
  object: {
    explode: !0,
    style: "deepObject"
  }
}), ue = {
  "Content-Type": "application/json"
}, V = (t = {}) => ({
  ...G,
  headers: ue,
  parseAs: "auto",
  querySerializer: le,
  ...t
}), fe = (t = {}) => {
  let e = P(V(), t);
  const r = () => ({ ...e }), o = (f) => (e = P(e, f), r()), n = ce(), l = async (f) => {
    const a = {
      ...e,
      ...f,
      fetch: f.fetch ?? e.fetch ?? globalThis.fetch,
      headers: R(e.headers, f.headers),
      serializedBody: void 0
    };
    a.security && await ie({
      ...a,
      security: a.security
    }), a.requestValidator && await a.requestValidator(a), a.body !== void 0 && a.bodySerializer && (a.serializedBody = a.bodySerializer(a.body)), (a.body === void 0 || a.serializedBody === "") && a.headers.delete("Content-Type");
    const d = D(a);
    return { opts: a, url: d };
  }, c = async (f) => {
    const { opts: a, url: d } = await l(f), E = {
      redirect: "follow",
      ...a,
      body: re(a)
    };
    let w = new Request(d, E);
    for (const h of n.request.fns)
      h && (w = await h(w, a));
    const C = a.fetch;
    let u = await C(w);
    for (const h of n.response.fns)
      h && (u = await h(u, w, a));
    const y = {
      request: w,
      response: u
    };
    if (u.ok) {
      const h = (a.parseAs === "auto" ? se(u.headers.get("Content-Type")) : a.parseAs) ?? "json";
      if (u.status === 204 || u.headers.get("Content-Length") === "0") {
        let g;
        switch (h) {
          case "arrayBuffer":
          case "blob":
          case "text":
            g = await u[h]();
            break;
          case "formData":
            g = new FormData();
            break;
          case "stream":
            g = u.body;
            break;
          default:
            g = {};
            break;
        }
        return a.responseStyle === "data" ? g : {
          data: g,
          ...y
        };
      }
      let p;
      switch (h) {
        case "arrayBuffer":
        case "blob":
        case "formData":
        case "json":
        case "text":
          p = await u[h]();
          break;
        case "stream":
          return a.responseStyle === "data" ? u.body : {
            data: u.body,
            ...y
          };
      }
      return h === "json" && (a.responseValidator && await a.responseValidator(p), a.responseTransformer && (p = await a.responseTransformer(p))), a.responseStyle === "data" ? p : {
        data: p,
        ...y
      };
    }
    const S = await u.text();
    let x;
    try {
      x = JSON.parse(S);
    } catch {
    }
    const j = x ?? S;
    let m = j;
    for (const h of n.error.fns)
      h && (m = await h(j, u, w, a));
    if (m = m || {}, a.throwOnError)
      throw m;
    return a.responseStyle === "data" ? void 0 : {
      error: m,
      ...y
    };
  }, s = (f) => (a) => c({ ...a, method: f }), i = (f) => async (a) => {
    const { opts: d, url: E } = await l(a);
    return Q({
      ...d,
      body: d.body,
      headers: d.headers,
      method: f,
      onRequest: async (w, C) => {
        let u = new Request(w, C);
        for (const y of n.request.fns)
          y && (u = await y(u, d));
        return u;
      },
      url: E
    });
  };
  return {
    buildUrl: D,
    connect: s("CONNECT"),
    delete: s("DELETE"),
    get: s("GET"),
    getConfig: r,
    head: s("HEAD"),
    interceptors: n,
    options: s("OPTIONS"),
    patch: s("PATCH"),
    post: s("POST"),
    put: s("PUT"),
    request: c,
    setConfig: o,
    sse: {
      connect: i("CONNECT"),
      delete: i("DELETE"),
      get: i("GET"),
      head: i("HEAD"),
      options: i("OPTIONS"),
      patch: i("PATCH"),
      post: i("POST"),
      put: i("PUT"),
      trace: i("TRACE")
    },
    trace: s("TRACE")
  };
}, de = (t) => ({
  ...t,
  ..._.getConfig()
}), A = fe(de(V({
  baseUrl: "https://localhost:44333"
})));
class ye {
  static analyzeMedia(e) {
    return (e?.client ?? A).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/aimediajanitor/api/v1/media/analyze",
      ...e
    });
  }
  static ping(e) {
    return (e?.client ?? A).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/aimediajanitor/api/v1/ping",
      ...e
    });
  }
  static whatsMyName(e) {
    return (e?.client ?? A).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/aimediajanitor/api/v1/whatsMyName",
      ...e
    });
  }
  static whatsTheTimeMrWolf(e) {
    return (e?.client ?? A).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/aimediajanitor/api/v1/whatsTheTimeMrWolf",
      ...e
    });
  }
  static whoAmI(e) {
    return (e?.client ?? A).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/aimediajanitor/api/v1/whoAmI",
      ...e
    });
  }
}
export {
  ye as A
};
//# sourceMappingURL=sdk.gen-BaEGBto3.js.map
