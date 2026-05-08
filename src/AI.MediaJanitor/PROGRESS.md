# AI Media Assistant – Build Progress

Tracks the incremental build of the AI Media Assistant feature for the
`Umbraco.Community.AI.MediaJanitor` package (Umbraco CMS 17 / .NET 10).

## Goal

Add an "AI Media Assistant" experience inside the existing **Media** section
(as a sibling of *Media* and *Recycle Bin*). When opened it lets editors:

- See images missing alt text
- See images with poor / generic names
- Select images for analysis
- Review AI suggestions (name, alt, optional caption, folder)
- Apply selected suggestions to the media item

All AI generation is performed via `Microsoft.Extensions.AI` (`IChatClient`) and
configured through Umbraco.AI provider packages (Umbraco.AI / Umbraco.AI.OpenAI
etc.) registered in the consuming site.

## Safety / quality contract (enforced in system prompt + post-validation)

- Never identify private individuals
- Never infer sensitive personal attributes
- Never claim certainty about things that are unclear
- Never create misleading alt text
- Never overwrite or dismiss existing editor-written metadata without good reason
- **Never output anything except valid JSON**
- Default language: English when context is unclear

## Parts & status

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

### Backend (C#)

- [x] **Part 1** – Progress file (`PROGRESS.md`)
- [x] **Part 2** – AI dependency wiring (`Microsoft.Extensions.AI` in csproj +
  `Directory.Packages.props`)
- [x] **Part 3** – Options + safety constants
  - `Configuration/MediaJanitorOptions.cs`
  - `Constants.cs` (extend with safety prompt fragments)
- [x] **Part 4** – DTO models in `Models/`
  - `MediaCandidate` + `CandidatePage`
  - `MediaAnalysisRequest`
  - `MediaAnalysisSuggestion`
  - `ApplySuggestionRequest` + `ApplySuggestionResult`
  - `FolderSuggestion`
- [x] **Part 5** – Services in `Services/`
  - `IMediaCandidateService` / `MediaCandidateService`
  - `IMediaAnalysisService` / `MediaAnalysisService` (obtains `IChatClient`
    via Umbraco.AI's `IAIChatService.CreateChatClientAsync`)
  - `IMediaSuggestionApplyService` / `MediaSuggestionApplyService`
- [x] **Part 6** – Composer registration of options + services
- [x] **Part 7** – API endpoints in `AIMediaJanitorMediaApiController`
  - `GET media/candidates?missingAlt&poorName&skip&take`
  - `POST media/analyze` (one media id)
  - `POST media/apply` (suggestion + selected fields)
  - Authorized by `SectionAccessMedia` policy

### Frontend (Backoffice extension)

- [x] **Part 8** – Register sidebar entry in **Media** section so the assistant
  appears next to *Media* and *Recycle Bin* (menu alias `Umb.Menu.Media`)
- [x] **Part 9** – Dashboard view in the Media section: candidate list,
  suggestion review, per-field accept toggles, apply/re-analyse actions.
  (`src/assistant/dashboard.manifest.ts` + `src/assistant/workspace.element.ts`)
  Reachable at `/section/media/dashboard/ai-media-assistant`.
- [x] **Part 10** – Update `bundle.manifests.ts` to include new manifests

- [x] **Part 11** – AI plumbing through Umbraco.AI's `IAIChatService`
  (`Microsoft.Extensions.AI` 10.2.0 + `Umbraco.AI.Core` 1.10.1).
  `MediaJanitorOptions` exposes `ProfileAlias` + `ChatAlias` for routing.

### Cross-cutting

- [ ] Regenerate OpenAPI client after API endpoints land
  (`npm run generate-client` once the test site is running)

## Setup — first-time AI configuration

Before the *Analyse* endpoint can succeed, the host site needs an Umbraco.AI
Connection. Steps for the bundled `AI.MediaJanitor.TestSite`:

1. (Recommended) store the OpenAI key out-of-band:
   ```
   cd src/AI.MediaJanitor.TestSite
   dotnet user-secrets init
   dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
   ```
2. Start the test site, log in to the backoffice.
3. Open **AI → Connections → Create Connection**:
   - Name: *OpenAI*
   - Alias: `openai-default`
   - Provider: *OpenAI*
   - API key: `$OpenAI:ApiKey` (or paste the raw key)
4. Optional: under **AI → Profiles**, set a vision-capable model
   (`gpt-4o-mini`, `gpt-4o`, etc.) on the default profile, or create a
   dedicated profile (e.g. alias `media-janitor`) for the assistant.
5. Optional: pin the assistant to a specific profile via
   `appsettings.Development.json`:
   ```json
   {
     "Umbraco": {
       "CMS": {
         "AIMediaJanitor": {
           "ProfileAlias": "media-janitor",
           "ChatAlias": "media-janitor"
         }
       }
     }
   }
   ```

## Notes

- The Media section in Umbraco 17 uses menu alias `Umb.Menu.Media`.
- Chat client resolution happens through `IAIChatService.CreateChatClientAsync`
  with the configured `ChatAlias` for telemetry and an optional
  `ProfileAlias`. If no profile alias is configured, Umbraco.AI uses the
  default profile.
- Without a Connection set up, the analyse endpoint returns a friendly
  error pointing at *AI → Connections* — no startup-time failure.
