namespace AI.MediaJanitor.Models;

public record MediaAnalysisSuggestions(
    string SuggestedName,
    string AltText,
    string? Caption,
    string? SuggestedFolder
);
