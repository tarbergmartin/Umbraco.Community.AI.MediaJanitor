using System.Text.Json.Serialization;

namespace AI.MediaJanitor.Models;

/// <summary>
/// The shape returned to the editor — wraps the model's payload with the
/// media key so the UI can correlate it.
/// </summary>
public class MediaAnalysisSuggestion
{
    public required Guid MediaKey { get; init; }
    public string? Name { get; init; }
    public string? AltText { get; init; }
    public string? Caption { get; init; }
    public FolderSuggestion? Folder { get; init; }
    public bool Uncertain { get; init; }
    public string? Note { get; init; }
}

/// <summary>
/// Internal: the JSON shape we ask the model for. Field names match the
/// schema embedded in the prompt — do not rename without updating the prompt.
/// </summary>
internal class MediaAnalysisPayload
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("alt")]
    public string? AltText { get; set; }

    [JsonPropertyName("caption")]
    public string? Caption { get; set; }

    [JsonPropertyName("folder")]
    public FolderSuggestion? Folder { get; set; }

    [JsonPropertyName("uncertain")]
    public bool Uncertain { get; set; }

    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public class FolderSuggestion
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("category")]
    public string? Category { get; set; }
}
