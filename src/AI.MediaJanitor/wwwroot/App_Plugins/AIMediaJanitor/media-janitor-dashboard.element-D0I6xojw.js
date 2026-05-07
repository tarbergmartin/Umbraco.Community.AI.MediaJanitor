import { LitElement as l, html as d, css as m, customElement as u } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin as p } from "@umbraco-cms/backoffice/element-api";
var b = Object.getOwnPropertyDescriptor, c = (r, o, s, i) => {
  for (var e = i > 1 ? void 0 : i ? b(o, s) : o, t = r.length - 1, n; t >= 0; t--)
    (n = r[t]) && (e = n(e) || e);
  return e;
};
let a = class extends p(l) {
  render() {
    return d`
      <uui-box headline="Media Janitor">
        <p>Welcome to Media Janitor. Use this dashboard to manage and clean up your media library.</p>
      </uui-box>
    `;
  }
};
a.styles = [
  m`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }
    `
];
a = c([
  u("media-janitor-dashboard")
], a);
const v = a;
export {
  a as MediaJanitorDashboardElement,
  v as default
};
//# sourceMappingURL=media-janitor-dashboard.element-D0I6xojw.js.map
