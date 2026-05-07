using System.Text.Json;
using AI.MediaJanitor.Models;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Umbraco.AI.Core.Chat;
using Umbraco.AI.Core.InlineChat;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Services;

namespace AI.MediaJanitor.Services;

public class MediaImageAnalysisService : IMediaImageAnalysisService
{
    private static readonly string[] SupportedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif"];

    private readonly IMediaService _mediaService;
    private readonly MediaFileManager _mediaFileManager;
    private readonly IAIChatService _chatService;
    private readonly ILogger<MediaImageAnalysisService> _logger;

    public MediaImageAnalysisService(
        IMediaService mediaService,
        MediaFileManager mediaFileManager,
        IAIChatService chatService,
        ILogger<MediaImageAnalysisService> logger)
    {
        _mediaService = mediaService;
        _mediaFileManager = mediaFileManager;
        _chatService = chatService;
        _logger = logger;
    }

    public async Task<MediaAnalysisSuggestions> AnalyzeAsync(Guid mediaKey, CancellationToken ct = default)
    {
        var media = _mediaService.GetById(mediaKey)
            ?? throw new KeyNotFoundException($"Media item {mediaKey} not found.");

        using var fileStream = _mediaFileManager.GetFile(media, out var mediaFilePath, "umbracoFile", null!, null!);
        if (fileStream is null)
            throw new InvalidOperationException($"No file found for media item {mediaKey}.");

        var extension = Path.GetExtension(mediaFilePath)?.ToLowerInvariant();
        if (!SupportedExtensions.Contains(extension))
            throw new InvalidOperationException($"Media item {mediaKey} is not a supported image type ('{extension}').");

        var mimeType = extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".bmp" => "image/bmp",
            ".tiff" or ".tif" => "image/tiff",
            _ => "image/jpeg"
        };

        using var buffer = new MemoryStream();
        await fileStream.CopyToAsync(buffer, ct);

        const string prompt = """
            Analyze this image and respond with a JSON object containing exactly these fields:
            - suggestedName: a concise descriptive file name without extension, use hyphens (e.g. "product-hero-smartphone")
            - altText: an accessibility-focused description of what is visible in the image
            - caption: a short engaging display caption for a media library, or null if not applicable
            - suggestedFolder: a suggested folder path like "Products/Electronics" or "Team/Headshots", or null if unclear

            Respond with valid JSON only. No markdown, no code fences.
            """;

        var messages = new List<ChatMessage>
        {
            new(ChatRole.User,
            [
                new TextContent(prompt),
                new DataContent(buffer.ToArray(), mimeType)
            ])
        };

        ChatResponse response;
        try
        {
            response = await _chatService.GetChatResponseAsync(
                configure: b => b
                    .WithAlias("media-image-analysis")
                    .WithName("Media Image Analysis"),
                messages: messages,
                cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI analysis failed for media {MediaKey}", mediaKey);
            throw;
        }

        return ParseSuggestions(response.Text ?? string.Empty);
    }

    private static MediaAnalysisSuggestions ParseSuggestions(string text)
    {
        try
        {
            var json = text.Trim();
            if (json.StartsWith("```"))
            {
                var newline = json.IndexOf('\n');
                var closing = json.LastIndexOf("```");
                if (newline >= 0 && closing > newline)
                    json = json[(newline + 1)..closing].Trim();
            }

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            return new MediaAnalysisSuggestions(
                SuggestedName: GetString(root, "suggestedName") ?? string.Empty,
                AltText: GetString(root, "altText") ?? string.Empty,
                Caption: GetString(root, "caption"),
                SuggestedFolder: GetString(root, "suggestedFolder")
            );
        }
        catch
        {
            return new MediaAnalysisSuggestions(
                SuggestedName: string.Empty,
                AltText: text,
                Caption: null,
                SuggestedFolder: null
            );
        }
    }

    private static string? GetString(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var prop))
            return null;
        return prop.ValueKind == JsonValueKind.Null ? null : prop.GetString();
    }
}
