using AI.MediaJanitor.Models;
using AI.MediaJanitor.Services;
using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AI.MediaJanitor.Controllers;

[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = "AI.MediaJanitor")]
public class MediaAnalysisController : AIMediaJanitorApiControllerBase
{
    private readonly IMediaImageAnalysisService _analysisService;

    public MediaAnalysisController(IMediaImageAnalysisService analysisService)
        => _analysisService = analysisService;

    [HttpPost("media/analyze")]
    [ProducesResponseType<MediaAnalysisSuggestions>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AnalyzeMedia(
        [FromBody] AnalyzeMediaRequest request,
        CancellationToken ct)
    {
        try
        {
            var suggestions = await _analysisService.AnalyzeAsync(request.MediaKey, ct);
            return Ok(suggestions);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}

public record AnalyzeMediaRequest(Guid MediaKey);
