using UnityEngine;
using HustleThrough.Progression;

namespace HustleThrough.Economy
{
    /// <summary>
    /// Thin display-layer helper — reads currency values straight from
    /// PlayerProgress (the authoritative server-synced state) rather than
    /// keeping any local copy that could drift or be tampered with.
    /// </summary>
    public class CurrencyManager : MonoBehaviour
    {
        public TMPro.TMP_Text CashLabel;
        public TMPro.TMP_Text NotesLabel;

        private void OnEnable()
        {
            PlayerProgress.Instance.OnProgressUpdated += HandleProgressUpdated;
            if (PlayerProgress.Instance.Current != null)
                HandleProgressUpdated(PlayerProgress.Instance.Current);
        }

        private void OnDisable()
        {
            if (PlayerProgress.Instance != null)
                PlayerProgress.Instance.OnProgressUpdated -= HandleProgressUpdated;
        }

        private void HandleProgressUpdated(ProgressionDto progress)
        {
            if (CashLabel != null) CashLabel.text = $"£{progress.cash_balance}";
            if (NotesLabel != null) NotesLabel.text = $"{progress.notes_balance} Notes";
        }
    }
}
