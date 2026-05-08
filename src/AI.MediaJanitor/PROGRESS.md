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
  - `IMediaAnalysisService` / `MediaAnalysisService` (calls `IChatClient`)
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

### Cross-cutting

- [ ] Regenerate OpenAPI client after API endpoints land
  (`npm run generate-client` once the test site is running)

## Notes

- The Media section in Umbraco 17 uses menu alias `Umb.Menu.StructureMedia`.
  We add a `menuItem` extension into that menu so the entry shows next to the
  built-in tree items, but routes to a custom workspace rather than to a tree.
- All AI calls go through `IChatClient`. The host site decides the provider by
  installing one of the `Umbraco.AI.*` packages and configuring it in
  `appsettings.json`.
- The package itself does **not** force a specific provider — it requires only
  `Microsoft.Extensions.AI.Abstractions` and resolves `IChatClient` from DI.
