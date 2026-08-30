namespace HustleThrough.IAP
{
    /// <summary>
    /// Product IDs must match EXACTLY what's configured in App Store Connect
    /// and Google Play Console, and must match the NOTES_PACKS keys in the
    /// backend's billingService.ts.
    ///
    /// IMPORTANT: this catalog intentionally contains no rank-skip or
    /// level-skip products. If a future product needs adding, it should be a
    /// Notes pack (real money -> hard currency) or a direct cosmetic/convenience
    /// purchase — never anything that maps to rank or level.
    /// </summary>
    public static class IAPCatalog
    {
        public const string NotesPackSmall = "notes_pack_small";   // 100 Notes
        public const string NotesPackMedium = "notes_pack_medium"; // 550 Notes
        public const string NotesPackLarge = "notes_pack_large";   // 1200 Notes

        public static readonly string[] AllProductIds =
        {
            NotesPackSmall,
            NotesPackMedium,
            NotesPackLarge,
        };
    }
}
