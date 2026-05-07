import {
  LitElement,
  css,
  html,
  customElement,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";

@customElement("media-janitor-dashboard")
export class MediaJanitorDashboardElement extends UmbElementMixin(LitElement) {
  render() {
    return html`
      <uui-box headline="Media Janitor">
        <p>Welcome to Media Janitor. Use this dashboard to manage and clean up your media library.</p>
      </uui-box>
    `;
  }

  static styles = [
    css`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }
    `,
  ];
}

export default MediaJanitorDashboardElement;

declare global {
  interface HTMLElementTagNameMap {
    "media-janitor-dashboard": MediaJanitorDashboardElement;
  }
}
