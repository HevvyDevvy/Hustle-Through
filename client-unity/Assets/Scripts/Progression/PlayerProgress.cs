using System;
using UnityEngine;
using HustleThrough.Networking;

namespace HustleThrough.Progression
{
    [Serializable]
    public class ProgressionDto
    {
        public string id;
        public string display_name;
        public int rank;
        public int level;
        public long cash_balance;
        public long notes_balance;
        public string rank_title;
        public string tier;
    }

    /// <summary>
    /// Pulls authoritative rank/level/currency state from the server.
    /// The client never computes rank locally — it only ever displays what
    /// the server last told it, refreshed after every job completion or purchase.
    /// </summary>
    public class PlayerProgress : MonoBehaviour
    {
        public static PlayerProgress Instance { get; private set; }
        public ProgressionDto Current { get; private set; }

        public event Action<ProgressionDto> OnProgressUpdated;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void Refresh(Action<bool> onComplete = null)
        {
            StartCoroutine(ApiClient.Instance.Get("/progression/me", (success, body) =>
            {
                if (success)
                {
                    Current = JsonUtility.FromJson<ProgressionDto>(body);
                    OnProgressUpdated?.Invoke(Current);
                }
                onComplete?.Invoke(success);
            }));
        }
    }
}
