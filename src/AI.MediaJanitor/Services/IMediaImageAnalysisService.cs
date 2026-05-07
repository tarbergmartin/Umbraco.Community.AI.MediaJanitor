using AI.MediaJanitor.Models;

namespace AI.MediaJanitor.Services;

public interface IMediaImageAnalysisService
{
    Task<MediaAnalysisSuggestions> AnalyzeAsync(Guid mediaKey, CancellationToken ct = default);
}
