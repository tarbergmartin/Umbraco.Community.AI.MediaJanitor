import {
  LitElement,
  css,
  html,
  customElement,
  state,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
// Re-use the auth-aware HTTP client the generated SDK uses, so our as-yet-
// ungenerated endpoints still get a bearer token attached.
import { client } from "../api/client.gen.js";

// Controller inherits the base route from AIMediaJanitorApiControllerBase
// ([BackOfficeRoute("aimediajanitor/api/v{version:apiVersion}")]), so actions
// are mounted directly under that prefix.
const API_BASE = "/umbraco/aimediajanitor/api/v1";

// Same shape the generated SDK uses on every call — the umbHttpClient auth
// interceptor only attaches a bearer token when `security` is set on the
// request, so manual calls must pass it too.
const BEARER_AUTH = [{ scheme: "bearer", type: "http" }] as const;

interface MediaCandidate {
  key: string;
  name: string;
  currentAltText?: string | null;
  folderPath?: string | null;
  mediaTypeAlias?: string | null;
  missingAlt: boolean;
  poorName: boolean;
}

interface FolderSuggestion {
  name?: string | null;
  category?: string | null;
}

interface AnalysisSuggestion {
  mediaKey: string;
  name?: string | null;
  altText?: string | null;
  caption?: string | null;
  folder?: FolderSuggestion | null;
  uncertain: boolean;
  note?: string | null;
}

interface CandidatePage {
  items: MediaCandidate[];
  total: number;
}

const ANALYZE_CONCURRENCY = 2;

@customElement("ai-media-assistant-workspace")
export class AIMediaAssistantWorkspaceElement extends UmbElementMixin(LitElement) {
  @state() private _missingAlt = true;
  @state() private _poorName = true;
  @state() private _loading = false;
  @state() private _candidates: MediaCandidate[] = [];
  @state() private _suggestions: Map<string, AnalysisSuggestion> = new Map();
  @state() private _busyKeys: Set<string> = new Set();
  @state() private _bulkRunning = false;
  @state() private _bulkProgress = 0;
  @state() private _bulkTotal = 0;
  @state() private _error?: string;

  #notifications?: typeof UMB_NOTIFICATION_CONTEXT.TYPE;

  constructor() {
    super();
    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (ctx) => {
      this.#notifications = ctx;
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    void this.#loadCandidates();
  }

  // -- data --------------------------------------------------------------

  async #loadCandidates() {
    this._loading = true;
    this._error = undefined;
    try {
      const { data, error, response } = await client.get<CandidatePage>({
        url: `${API_BASE}/candidates`,
        security: BEARER_AUTH,
        query: {
          missingAlt: this._missingAlt,
          poorName: this._poorName,
          skip: 0,
          take: 50,
        },
      });
      if (error || !data) {
        throw new Error(`Failed to load candidates (${response.status})`);
      }
      this._candidates = data.items;
      // Drop suggestions for items that disappeared from the list.
      const keep = new Set(data.items.map((c) => c.key));
      const filtered = new Map<string, AnalysisSuggestion>();
      for (const [k, v] of this._suggestions) {
        if (keep.has(k)) filtered.set(k, v);
      }
      this._suggestions = filtered;
    } catch (e) {
      this._error = (e as Error).message;
    } finally {
      this._loading = false;
    }
  }

  async #analyzeOne(key: string): Promise<void> {
    const busy = new Set(this._busyKeys);
    busy.add(key);
    this._busyKeys = busy;
    try {
      const { data, error, response } = await client.post<AnalysisSuggestion>({
        url: `${API_BASE}/analyze`,
        security: BEARER_AUTH,
        body: { mediaKey: key },
      });
      if (error || !data) {
        throw new Error(`Analyze failed (${response.status})`);
      }
      const next = new Map(this._suggestions);
      next.set(key, data);
      this._suggestions = next;
    } catch (e) {
      this.#notifications?.peek("danger", {
        data: { headline: "Analyze failed", message: (e as Error).message },
      });
    } finally {
      const busy2 = new Set(this._busyKeys);
      busy2.delete(key);
      this._busyKeys = busy2;
    }
  }

  /**
   * Runs analysis over every loaded candidate. We bound concurrency because
   * a single tenant hammering its AI provider with 50 parallel image calls is
   * an easy way to hit rate limits and get 429s.
   */
  async #analyzeAll() {
    if (this._candidates.length === 0 || this._bulkRunning) return;

    this._bulkRunning = true;
    this._bulkProgress = 0;
    this._bulkTotal = this._candidates.length;

    const queue = [...this._candidates];
    const workers = Array.from({ length: ANALYZE_CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) return;
        await this.#analyzeOne(next.key);
        this._bulkProgress = this._bulkProgress + 1;
      }
    });

    try {
      await Promise.all(workers);
      this.#notifications?.peek("positive", {
        data: {
          headline: "Analysis complete",
          message: `Analysed ${this._bulkTotal} item${this._bulkTotal === 1 ? "" : "s"}.`,
        },
      });
    } finally {
      this._bulkRunning = false;
    }
  }

  async #applyOne(key: string) {
    const suggestion = this._suggestions.get(key);
    if (!suggestion) return;

    // Apply every non-empty suggested field by default. The editor reviews the
    // table first; if they want to skip a row they just don't click Apply.
    const body: Record<string, unknown> = { mediaKey: key };
    if (suggestion.name) body.name = suggestion.name;
    if (suggestion.altText) body.altText = suggestion.altText;
    if (suggestion.caption) body.caption = suggestion.caption;

    if (Object.keys(body).length === 1) {
      this.#notifications?.peek("warning", {
        data: { headline: "Nothing to apply", message: "The suggestion is empty for this item." },
      });
      return;
    }

    const busy = new Set(this._busyKeys);
    busy.add(key);
    this._busyKeys = busy;
    try {
      const { error, response } = await client.post({
        url: `${API_BASE}/apply`,
        security: BEARER_AUTH,
        body,
      });
      if (error) {
        throw new Error(`Apply failed (${response.status})`);
      }
      this.#notifications?.peek("positive", {
        data: {
          headline: "Applied",
          message: `Updated ${suggestion.name ?? "media item"}`,
        },
      });

      this._candidates = this._candidates.filter((c) => c.key !== key);
      const sug = new Map(this._suggestions);
      sug.delete(key);
      this._suggestions = sug;
    } catch (e) {
      this.#notifications?.peek("danger", {
        data: { headline: "Apply failed", message: (e as Error).message },
      });
    } finally {
      const busy2 = new Set(this._busyKeys);
      busy2.delete(key);
      this._busyKeys = busy2;
    }
  }

  // -- render ------------------------------------------------------------

  render() {
    const analyzedCount = this._suggestions.size;
    const totalCount = this._candidates.length;

    return html`
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
              @change=${(e: Event) => {
                this._missingAlt = (e.target as HTMLInputElement).checked;
              }}
            ></uui-toggle>
            <uui-toggle
              label="Poor / generic name"
              ?checked=${this._poorName}
              @change=${(e: Event) => {
                this._poorName = (e.target as HTMLInputElement).checked;
              }}
            ></uui-toggle>
            <uui-button look="secondary" @click=${() => this.#loadCandidates()}>
              Refresh list
            </uui-button>
            <uui-button
              look="primary"
              color="positive"
              ?disabled=${this._bulkRunning || totalCount === 0}
              @click=${() => this.#analyzeAll()}
            >
              ${this._bulkRunning
                ? `Analysing ${this._bulkProgress} / ${this._bulkTotal}…`
                : `Analyse all images (${totalCount})`}
            </uui-button>
            <span class="muted small"
              >${analyzedCount} of ${totalCount} analysed</span
            >
          </div>

          ${this._bulkRunning
            ? html`<uui-loader-bar></uui-loader-bar>`
            : null}
          ${this._error ? html`<p class="error">${this._error}</p>` : null}
        </uui-box>

        ${this._loading
          ? html`<uui-loader></uui-loader>`
          : this._candidates.length === 0
            ? html`<uui-box
                ><p>No images need attention with the current filters.</p></uui-box
              >`
            : this.#renderTable()}
      </umb-body-layout>
    `;
  }

  #renderTable() {
    return html`
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
          ${this._candidates.map((c) => this.#renderRow(c))}
        </uui-table>
      </uui-box>
    `;
  }

  #renderRow(c: MediaCandidate) {
    const s = this._suggestions.get(c.key);
    const busy = this._busyKeys.has(c.key);

    return html`
      <uui-table-row class=${busy ? "row-busy" : ""}>
        <uui-table-cell>
          <div class="file-cell">
            <strong title=${c.name}>${c.name}</strong>
            <span class="muted small" title=${c.folderPath ?? "/"}
              >${c.folderPath ?? "/"}</span
            >
          </div>
        </uui-table-cell>
        <uui-table-cell>
          <div class="tags">
            ${c.missingAlt
              ? html`<uui-tag color="danger" look="primary" size="s">no alt</uui-tag>`
              : null}
            ${c.poorName
              ? html`<uui-tag color="warning" look="primary" size="s"
                  >generic name</uui-tag
                >`
              : null}
          </div>
        </uui-table-cell>
        <uui-table-cell>
          <span class=${c.currentAltText ? "" : "muted"}
            >${c.currentAltText ?? "—"}</span
          >
        </uui-table-cell>
        <uui-table-cell>
          ${this.#renderSuggestedField(s?.name, c.name)}
        </uui-table-cell>
        <uui-table-cell>
          ${this.#renderSuggestedField(s?.altText, c.currentAltText ?? "")}
        </uui-table-cell>
        <uui-table-cell>
          <span class=${s?.caption ? "" : "muted"}>${s?.caption ?? "—"}</span>
        </uui-table-cell>
        <uui-table-cell>
          ${s
            ? s.uncertain
              ? html`<uui-tag color="warning" size="s" title=${s.note ?? ""}
                  >uncertain</uui-tag
                >`
              : html`<uui-tag color="positive" size="s">ok</uui-tag>`
            : html`<span class="muted">—</span>`}
        </uui-table-cell>
        <uui-table-cell>
          <div class="actions">
            <uui-button
              size="s"
              look="secondary"
              ?disabled=${busy || this._bulkRunning}
              @click=${() => this.#analyzeOne(c.key)}
            >
              ${s ? "Re-analyse" : "Analyse"}
            </uui-button>
            <uui-button
              size="s"
              look="primary"
              color="positive"
              ?disabled=${busy || !s}
              @click=${() => this.#applyOne(c.key)}
            >
              Apply
            </uui-button>
            ${busy ? html`<uui-loader-circle></uui-loader-circle>` : null}
          </div>
        </uui-table-cell>
      </uui-table-row>
    `;
  }

  #renderSuggestedField(suggested: string | null | undefined, current: string) {
    if (!suggested) {
      return html`<span class="muted">—</span>`;
    }
    const changed = suggested !== current;
    return html`
      <code class=${changed ? "diff" : ""}>${suggested}</code>
    `;
  }

  static styles = [
    css`
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
    `,
  ];
}

export default AIMediaAssistantWorkspaceElement;

declare global {
  interface HTMLElementTagNameMap {
    "ai-media-assistant-workspace": AIMediaAssistantWorkspaceElement;
  }
}
