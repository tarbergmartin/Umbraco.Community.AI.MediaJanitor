using AI.MediaJanitor.Models;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;

namespace AI.MediaJanitor.Services;

public class MediaSuggestionApplyService : IMediaSuggestionApplyService
{
    private static readonly string[] AltAliases =
    {
        "altText",
        "alternativeText",
        "alt",
        "altTekst",
    };

    private static readonly string[] CaptionAliases =
    {
        "caption",
        "imageCaption",
    };

    private readonly IMediaService _mediaService;
    private readonly ILogger<MediaSuggestionApplyService> _logger;

    public MediaSuggestionApplyService(
        IMediaService mediaService,
        ILogger<MediaSuggestionApplyService> logger)
    {
        _mediaService = mediaService;
        _logger = logger;
    }

    public Task<ApplySuggestionResult> ApplyAsync(
        ApplySuggestionRequest request,
        int userId,
        CancellationToken ct)
    {
        var media = _mediaService.GetById(request.MediaKey);
        if (media is null)
        {
            return Task.FromResult(new ApplySuggestionResult
            {
                MediaKey = request.MediaKey,
                Success = false,
                ErrorMessage = "Media item not found.",
            });
        }

        var applied = new List<string>();

        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name != media.Name)
        {
            media.Name = request.Name;
            applied.Add("name");
        }

        if (request.AltText is not null
            && TrySetFirstMatchingProperty(media, AltAliases, request.AltText))
        {
            applied.Add("altText");
        }

        if (request.Caption is not null
            && TrySetFirstMatchingProperty(media, CaptionAliases, request.Caption))
        {
            applied.Add("caption");
        }

        if (request.TargetFolderKey is { } folderKey)
        {
            var folder = _mediaService.GetById(folderKey);
            if (folder is not null && folder.Id != media.ParentId)
            {
                _mediaService.Move(media, folder.Id, userId);
                applied.Add("folder");
            }
        }

        if (applied.Count == 0)
        {
            return Task.FromResult(new ApplySuggestionResult
            {
                MediaKey = request.MediaKey,
                Success = true,
                AppliedFields = Array.Empty<string>(),
            });
        }

        var saveResult = _mediaService.Save(media, userId);
        if (!saveResult.Success)
        {
            _logger.LogWarning("Saving media {Key} failed: {Result}", media.Key, saveResult.Result);
            return Task.FromResult(new ApplySuggestionResult
            {
                MediaKey = request.MediaKey,
                Success = false,
                ErrorMessage = $"Save failed: {saveResult.Result}",
            });
        }

        return Task.FromResult(new ApplySuggestionResult
        {
            MediaKey = request.MediaKey,
            Success = true,
            AppliedFields = applied.ToArray(),
        });
    }

    private static bool TrySetFirstMatchingProperty(IMedia media, string[] aliases, string value)
    {
        foreach (var alias in aliases)
        {
            if (!media.HasProperty(alias)) continue;
            media.SetValue(alias, value);
            return true;
        }

        return false;
    }
}
