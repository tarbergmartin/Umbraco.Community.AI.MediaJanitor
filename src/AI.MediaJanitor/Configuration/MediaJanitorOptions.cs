namespace AI.MediaJanitor.Configuration;

/// <summary>
/// Editor-controlled tuning for the AI Media Assistant.
/// Bind from <c>Umbraco:CMS:AIMediaJanitor</c> in <c>appsettings.json</c>.
/// </summary>
public class MediaJanitorOptions
{
    public const string SectionName = "Umbraco:CMS:AIMediaJanitor";

    /// <summary>
    /// Default response language when the image gives no clear language signal.
    /// </summary>
    public string DefaultLanguage { get; set; } = "en";

    /// <summary>
    /// Maximum bytes of image data forwarded to the model. Larger images are
    /// rejected up front to keep cost predictable.
    /// </summary>
    public int MaxImageBytes { get; set; } = 8 * 1024 * 1024;

    /// <summary>
    /// Names that count as "poor / generic" when scanning for candidates
    /// (case-insensitive prefix match).
    /// </summary>
    public string[] PoorNamePrefixes { get; set; } =
    {
        "img_",
        "image",
        "dsc",
        "dsc_",
        "screenshot",
        "untitled",
        "photo",
        "pasted",
        "scan",
    };

    /// <summary>
    /// Maximum candidates returned per page from the candidates endpoint.
    /// </summary>
    public int MaxPageSize { get; set; } = 50;
}
