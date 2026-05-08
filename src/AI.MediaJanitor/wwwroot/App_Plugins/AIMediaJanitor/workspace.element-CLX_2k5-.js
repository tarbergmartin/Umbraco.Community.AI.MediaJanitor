import { LitElement as E, html as i, css as R, state as d, customElement as N } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin as P } from "@umbraco-cms/backoffice/element-api";
import { UMB_NOTIFICATION_CONTEXT as M } from "@umbraco-cms/backoffice/notification";
import { c as y } from "./client.gen-BUI-owez.js";
var K = Object.defineProperty, S = Object.getOwnPropertyDescriptor, $ = (e) => {
  throw TypeError(e);
}, r = (e, t, s, u) => {
  for (var a = u > 1 ? void 0 : u ? S(t, s) : t, n = e.length - 1, h; n >= 0; n--)
    (h = e[n]) && (a = (u ? h(t, s, a) : h(a)) || a);
  return u && a && K(t, s, a), a;
}, m = (e, t, s) => t.has(e) || $("Cannot " + s), g = (e, t, s) => (m(e, t, "read from private field"), s ? s.call(e) : t.get(e)), w = (e, t, s) => t.has(e) ? $("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, s), O = (e, t, s, u) => (m(e, t, "write to private field"), t.set(e, s), s), c = (e, t, s) => (m(e, t, "access private method"), s), p, o, b, f, A, x, T, z, _;
const k = "/umbraco/aimediajanitor/api/v1", v = [{ scheme: "bearer", type: "http" }], I = 2;
let l = class extends P(E) {
  constructor() {
    super(), w(this, o), this._missingAlt = !0, this._poorName = !0, this._loading = !1, this._candidates = [], this._suggestions = /* @__PURE__ */ new Map(), this._busyKeys = /* @__PURE__ */ new Set(), this._bulkRunning = !1, this._bulkProgress = 0, this._bulkTotal = 0, w(this, p), this.consumeContext(M, (e) => {
      O(this, p, e);
    });
  }
  connectedCallback() {
    super.connectedCallback(), c(this, o, b).call(this);
  }
  // -- render ------------------------------------------------------------
  render() {
    const e = this._suggestions.size, t = this._candidates.length;
    return i`
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
            <uui-button look="secondary" @click=${() => c(this, o, b).call(this)}>
              Refresh list
            </uui-button>
            <uui-button
              look="primary"
              color="positive"
              ?disabled=${this._bulkRunning || t === 0}
              @click=${() => c(this, o, A).call(this)}
            >
              ${this._bulkRunning ? `Analysing ${this._bulkProgress} / ${this._bulkTotal}…` : `Analyse all images (${t})`}
            </uui-button>
            <span class="muted small"
              >${e} of ${t} analysed</span
            >
          </div>

          ${this._bulkRunning ? i`<uui-loader-bar></uui-loader-bar>` : null}
          ${this._error ? i`<p class="error">${this._error}</p>` : null}
        </uui-box>

        ${this._loading ? i`<uui-loader></uui-loader>` : this._candidates.length === 0 ? i`<uui-box
                ><p>No images need attention with the current filters.</p></uui-box
              >` : c(this, o, T).call(this)}
      </umb-body-layout>
    `;
  }
};
p = /* @__PURE__ */ new WeakMap();
o = /* @__PURE__ */ new WeakSet();
b = async function() {
  this._loading = !0, this._error = void 0;
  try {
    const { data: e, error: t, response: s } = await y.get({
      url: `${k}/candidates`,
      security: v,
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
    const u = new Set(e.items.map((n) => n.key)), a = /* @__PURE__ */ new Map();
    for (const [n, h] of this._suggestions)
      u.has(n) && a.set(n, h);
    this._suggestions = a;
  } catch (e) {
    this._error = e.message;
  } finally {
    this._loading = !1;
  }
};
f = async function(e) {
  const t = new Set(this._busyKeys);
  t.add(e), this._busyKeys = t;
  try {
    const { data: s, error: u, response: a } = await y.post({
      url: `${k}/analyze`,
      security: v,
      body: { mediaKey: e }
    });
    if (u || !s)
      throw new Error(`Analyze failed (${a.status})`);
    const n = new Map(this._suggestions);
    n.set(e, s), this._suggestions = n;
  } catch (s) {
    g(this, p)?.peek("danger", {
      data: { headline: "Analyze failed", message: s.message }
    });
  } finally {
    const s = new Set(this._busyKeys);
    s.delete(e), this._busyKeys = s;
  }
};
A = async function() {
  if (this._candidates.length === 0 || this._bulkRunning) return;
  this._bulkRunning = !0, this._bulkProgress = 0, this._bulkTotal = this._candidates.length;
  const e = [...this._candidates], t = Array.from({ length: I }, async () => {
    for (; e.length > 0; ) {
      const s = e.shift();
      if (!s) return;
      await c(this, o, f).call(this, s.key), this._bulkProgress = this._bulkProgress + 1;
    }
  });
  try {
    await Promise.all(t), g(this, p)?.peek("positive", {
      data: {
        headline: "Analysis complete",
        message: `Analysed ${this._bulkTotal} item${this._bulkTotal === 1 ? "" : "s"}.`
      }
    });
  } finally {
    this._bulkRunning = !1;
  }
};
x = async function(e) {
  const t = this._suggestions.get(e);
  if (!t) return;
  const s = { mediaKey: e };
  if (t.name && (s.name = t.name), t.altText && (s.altText = t.altText), t.caption && (s.caption = t.caption), Object.keys(s).length === 1) {
    g(this, p)?.peek("warning", {
      data: { headline: "Nothing to apply", message: "The suggestion is empty for this item." }
    });
    return;
  }
  const u = new Set(this._busyKeys);
  u.add(e), this._busyKeys = u;
  try {
    const { error: a, response: n } = await y.post({
      url: `${k}/apply`,
      security: v,
      body: s
    });
    if (a)
      throw new Error(`Apply failed (${n.status})`);
    g(this, p)?.peek("positive", {
      data: {
        headline: "Applied",
        message: `Updated ${t.name ?? "media item"}`
      }
    }), this._candidates = this._candidates.filter((C) => C.key !== e);
    const h = new Map(this._suggestions);
    h.delete(e), this._suggestions = h;
  } catch (a) {
    g(this, p)?.peek("danger", {
      data: { headline: "Apply failed", message: a.message }
    });
  } finally {
    const a = new Set(this._busyKeys);
    a.delete(e), this._busyKeys = a;
  }
};
T = function() {
  return i`
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
          ${this._candidates.map((e) => c(this, o, z).call(this, e))}
        </uui-table>
      </uui-box>
    `;
};
z = function(e) {
  const t = this._suggestions.get(e.key), s = this._busyKeys.has(e.key);
  return i`
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
            ${e.missingAlt ? i`<uui-tag color="danger" look="primary" size="s">no alt</uui-tag>` : null}
            ${e.poorName ? i`<uui-tag color="warning" look="primary" size="s"
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
          ${c(this, o, _).call(this, t?.name, e.name)}
        </uui-table-cell>
        <uui-table-cell>
          ${c(this, o, _).call(this, t?.altText, e.currentAltText ?? "")}
        </uui-table-cell>
        <uui-table-cell>
          <span class=${t?.caption ? "" : "muted"}>${t?.caption ?? "—"}</span>
        </uui-table-cell>
        <uui-table-cell>
          ${t ? t.uncertain ? i`<uui-tag color="warning" size="s" title=${t.note ?? ""}
                  >uncertain</uui-tag
                >` : i`<uui-tag color="positive" size="s">ok</uui-tag>` : i`<span class="muted">—</span>`}
        </uui-table-cell>
        <uui-table-cell>
          <div class="actions">
            <uui-button
              size="s"
              look="secondary"
              ?disabled=${s || this._bulkRunning}
              @click=${() => c(this, o, f).call(this, e.key)}
            >
              ${t ? "Re-analyse" : "Analyse"}
            </uui-button>
            <uui-button
              size="s"
              look="primary"
              color="positive"
              ?disabled=${s || !t}
              @click=${() => c(this, o, x).call(this, e.key)}
            >
              Apply
            </uui-button>
            ${s ? i`<uui-loader-circle></uui-loader-circle>` : null}
          </div>
        </uui-table-cell>
      </uui-table-row>
    `;
};
_ = function(e, t) {
  return e ? i`
      <code class=${e !== t ? "diff" : ""}>${e}</code>
    ` : i`<span class="muted">—</span>`;
};
l.styles = [
  R`
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
r([
  d()
], l.prototype, "_missingAlt", 2);
r([
  d()
], l.prototype, "_poorName", 2);
r([
  d()
], l.prototype, "_loading", 2);
r([
  d()
], l.prototype, "_candidates", 2);
r([
  d()
], l.prototype, "_suggestions", 2);
r([
  d()
], l.prototype, "_busyKeys", 2);
r([
  d()
], l.prototype, "_bulkRunning", 2);
r([
  d()
], l.prototype, "_bulkProgress", 2);
r([
  d()
], l.prototype, "_bulkTotal", 2);
r([
  d()
], l.prototype, "_error", 2);
l = r([
  N("ai-media-assistant-workspace")
], l);
const q = l;
export {
  l as AIMediaAssistantWorkspaceElement,
  q as default
};
//# sourceMappingURL=workspace.element-CLX_2k5-.js.map
