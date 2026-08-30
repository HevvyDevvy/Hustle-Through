using System;
using System.Collections.Generic;
using UnityEngine;
using HustleThrough.Networking;
using HustleThrough.Progression;

namespace HustleThrough.JobRack
{
    [Serializable]
    public class JobDto
    {
        public string id;
        public int level;
        public int rank_required;
        public string title;
        public string location;
        public string task_description;
        public long cash_reward;
        public bool is_story_gate;
        public bool is_bonus_pool;
    }

    [Serializable]
    public class RackResponse
    {
        public int playerRank;
        public int playerLevel;
        public List<JobDto> storyJobs;
        public List<JobDto> bonusJobs;
    }

    [Serializable]
    public class CompleteJobResponse
    {
        public long cashAwarded;
        public int rankAfter;
        public int levelAfter;
        public bool rankedUp;
    }

    /// <summary>
    /// Drives the "business card rack" UI: fetches available cards for the
    /// player's current rank, and reports job completion back to the server.
    /// All reward/rank logic happens server-side — this script just displays
    /// results and never mutates currency or rank locally.
    /// </summary>
    public class JobRackManager : MonoBehaviour
    {
        public static JobRackManager Instance { get; private set; }

        public event Action<RackResponse> OnRackRefreshed;
        public event Action<CompleteJobResponse> OnJobCompleted;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void RefreshRack()
        {
            StartCoroutine(ApiClient.Instance.Get("/jobs/rack", (success, body) =>
            {
                if (success)
                {
                    var rack = JsonUtility.FromJson<RackResponse>(body);
                    OnRackRefreshed?.Invoke(rack);
                }
                else
                {
                    Debug.LogWarning("Failed to refresh job rack: " + body);
                }
            }));
        }

        public void CompleteJob(string jobId)
        {
            StartCoroutine(ApiClient.Instance.Post($"/jobs/{jobId}/complete", "{}", (success, body) =>
            {
                if (success)
                {
                    var result = JsonUtility.FromJson<CompleteJobResponse>(body);
                    OnJobCompleted?.Invoke(result);
                    // Pull fresh authoritative state after any job completion.
                    PlayerProgress.Instance.Refresh();
                }
                else
                {
                    Debug.LogWarning("Job completion rejected by server: " + body);
                }
            }));
        }
    }
}
