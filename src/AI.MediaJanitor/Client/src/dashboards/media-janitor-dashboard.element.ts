import {
  LitElement,
  css,
  html,
  customElement,
  state,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { AIMediaJanitorService, MediaAnalysisSuggestionsModel } from "../api/index.js";

@customElement("media-janitor-dashboard")
export class MediaJanitorDashboardElement extends UmbElementMixin(LitElement) {
  @state() private _mediaKey = "";
  @state() private _isAnalyzing = false;
  @state() private _suggestions: MediaAnalysisSuggestionsModel | null = null;
  @state() private _error: string | null = null;

  #notificationContext?: typeof UMB_NOTIFICATION_CONTEXT.TYPE;

  constructor() {
    super();
    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (ctx) => {
      this.#notificationContext = ctx;
    });
  }

  #onAnalyze = async () => {
    const key = this._mediaKey.trim();
    if (!key) return;

    this._isAnalyzing = true;
    this._error = null;
    this._suggestions = null;

    const { data, error } = await AIMediaJanitorService.analyzeMedia({
      body: { mediaKey: key },
    });

    this._isAnalyzing = false;

    if (error) {
      this._error =
        "Analysis failed. Verify the media key is correct and that a vision-capable AI profile is configured.";
      return;
    }

    this._suggestions = data ?? null;
  };

  #copyToClipboard = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    this.#notificationContext?.peek("positive", {
      data: { headline: "Copied", message: `${label} copied to clipboard` },
    });
  };

  #renderSuggestion(label: string, value: string | null | undefined) {
    const hasValue = value !== null && value !== undefined && value !== "";
    return html`
      <div class="suggestion-row">
        <span class="suggestion-label">${label}</span>
        <span class="suggestion-value">${hasValue ? value : html`<em>—</em>`}</span>
        ${hasValue
          ? html`<uui-button
              compact
              look="outline"
              @click=${() => this.#copyToClipboard(value!, label)}
            >Copy</uui-button>`
          : ""}
      </div>
    `;
  }

  render() {
    return html`
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
            @input=${(e: Event) =>
              (this._mediaKey = (e.target as HTMLInputElement).value)}
          ></uui-input>
          <uui-button
            look="primary"
            color="default"
            .state=${this._isAnalyzing ? "waiting" : ""}
            ?disabled=${!this._mediaKey.trim() || this._isAnalyzing}
            @click=${this.#onAnalyze}
          >
            Analyze
          </uui-button>
        </div>
        ${this._error ? html`<p class="error">${this._error}</p>` : ""}
      </uui-box>

      ${this._suggestions
        ? html`
            <uui-box headline="Suggestions">
              ${this.#renderSuggestion(
                "Suggested Name",
                this._suggestions.suggestedName
              )}
              ${this.#renderSuggestion("Alt Text", this._suggestions.altText)}
              ${this.#renderSuggestion("Caption", this._suggestions.caption)}
              ${this.#renderSuggestion(
                "Suggested Folder",
                this._suggestions.suggestedFolder
              )}
            </uui-box>
          `
        : ""}
    `;
  }

  static styles = [
    css`
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
    `,
  ];
}

export default MediaJanitorDashboardElement;

declare global {
  interface HTMLElementTagNameMap {
    "media-janitor-dashboard": MediaJanitorDashboardElement;
  }
}
