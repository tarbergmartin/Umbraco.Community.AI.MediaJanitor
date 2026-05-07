import { LitElement as b, html as o, css as w, state as g, customElement as A } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin as $ } from "@umbraco-cms/backoffice/element-api";
import { UMB_NOTIFICATION_CONTEXT as z } from "@umbraco-cms/backoffice/notification";
import { A as M } from "./sdk.gen-BaEGBto3.js";
var C = Object.defineProperty, k = Object.getOwnPropertyDescriptor, f = (e) => {
  throw TypeError(e);
}, u = (e, t, i, n) => {
  for (var a = n > 1 ? void 0 : n ? k(t, i) : t, h = e.length - 1, _; h >= 0; h--)
    (_ = e[h]) && (a = (n ? _(t, i, a) : _(a)) || a);
  return n && a && C(t, i, a), a;
}, v = (e, t, i) => t.has(e) || f("Cannot " + i), x = (e, t, i) => (v(e, t, "read from private field"), i ? i.call(e) : t.get(e)), d = (e, t, i) => t.has(e) ? f("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), I = (e, t, i, n) => (v(e, t, "write to private field"), t.set(e, i), i), p = (e, t, i) => (v(e, t, "access private method"), i), c, m, y, r, l;
let s = class extends $(b) {
  constructor() {
    super(), d(this, r), this._mediaKey = "", this._isAnalyzing = !1, this._suggestions = null, this._error = null, d(this, c), d(this, m, async () => {
      const e = this._mediaKey.trim();
      if (!e) return;
      this._isAnalyzing = !0, this._error = null, this._suggestions = null;
      const { data: t, error: i } = await M.analyzeMedia({
        body: { mediaKey: e }
      });
      if (this._isAnalyzing = !1, i) {
        this._error = "Analysis failed. Verify the media key is correct and that a vision-capable AI profile is configured.";
        return;
      }
      this._suggestions = t ?? null;
    }), d(this, y, async (e, t) => {
      await navigator.clipboard.writeText(e), x(this, c)?.peek("positive", {
        data: { headline: "Copied", message: `${t} copied to clipboard` }
      });
    }), this.consumeContext(z, (e) => {
      I(this, c, e);
    });
  }
  render() {
    return o`
      <uui-box headline="AI Media Assistant">
        <p>
          Paste a media item GUID to get AI-generated suggestions for name, alt
          text, caption, and folder.
        </p>
        <div class="input-row">
          <uui-input
            label="Media Item Key (GUID)"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            .value=${this._mediaKey}
            @input=${(e) => this._mediaKey = e.target.value}
          ></uui-input>
          <uui-button
            look="primary"
            color="default"
            .state=${this._isAnalyzing ? "waiting" : ""}
            ?disabled=${!this._mediaKey.trim() || this._isAnalyzing}
            @click=${x(this, m)}
          >
            Analyze
          </uui-button>
        </div>
        ${this._error ? o`<p class="error">${this._error}</p>` : ""}
      </uui-box>

      ${this._suggestions ? o`
            <uui-box headline="Suggestions">
              ${p(this, r, l).call(this, "Suggested Name", this._suggestions.suggestedName)}
              ${p(this, r, l).call(this, "Alt Text", this._suggestions.altText)}
              ${p(this, r, l).call(this, "Caption", this._suggestions.caption)}
              ${p(this, r, l).call(this, "Suggested Folder", this._suggestions.suggestedFolder)}
            </uui-box>
          ` : ""}
    `;
  }
};
c = /* @__PURE__ */ new WeakMap();
m = /* @__PURE__ */ new WeakMap();
y = /* @__PURE__ */ new WeakMap();
r = /* @__PURE__ */ new WeakSet();
l = function(e, t) {
  const i = t != null && t !== "";
  return o`
      <div class="suggestion-row">
        <span class="suggestion-label">${e}</span>
        <span class="suggestion-value">${i ? t : o`<em>—</em>`}</span>
        ${i ? o`<uui-button
              compact
              look="outline"
              @click=${() => x(this, y).call(this, t, e)}
            >Copy</uui-button>` : ""}
      </div>
    `;
};
s.styles = [
  w`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--uui-size-layout-1);
        padding: var(--uui-size-layout-1);
      }

      p {
        margin: 0 0 var(--uui-size-space-4);
        color: var(--uui-color-text-alt);
      }

      .input-row {
        display: flex;
        gap: var(--uui-size-space-3);
        align-items: center;
      }

      uui-input {
        flex: 1;
      }

      .error {
        margin: var(--uui-size-space-3) 0 0;
        color: var(--uui-color-danger);
      }

      .suggestion-row {
        display: grid;
        grid-template-columns: 10rem 1fr auto;
        align-items: start;
        gap: var(--uui-size-space-3);
        padding: var(--uui-size-space-3) 0;
        border-bottom: 1px solid var(--uui-color-divider);
      }

      .suggestion-row:last-child {
        border-bottom: none;
      }

      .suggestion-label {
        font-weight: bold;
        color: var(--uui-color-text-alt);
        padding-top: 2px;
      }

      .suggestion-value {
        word-break: break-word;
        line-height: 1.5;
      }

      em {
        color: var(--uui-color-disabled-contrast);
      }
    `
];
u([
  g()
], s.prototype, "_mediaKey", 2);
u([
  g()
], s.prototype, "_isAnalyzing", 2);
u([
  g()
], s.prototype, "_suggestions", 2);
u([
  g()
], s.prototype, "_error", 2);
s = u([
  A("media-janitor-dashboard")
], s);
const D = s;
export {
  s as MediaJanitorDashboardElement,
  D as default
};
//# sourceMappingURL=media-janitor-dashboard.element-B7yo3QDB.js.map
