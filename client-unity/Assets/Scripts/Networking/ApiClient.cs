using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace HustleThrough.Networking
{
    /// <summary>
    /// Thin wrapper around UnityWebRequest for talking to the Hustle Through backend.
    /// Attach one instance to a persistent GameObject (e.g. a "Services" root that
    /// survives scene loads) and access it via ApiClient.Instance.
    /// </summary>
    public class ApiClient : MonoBehaviour
    {
        public static ApiClient Instance { get; private set; }

        [Tooltip("Base URL of the hosted backend, e.g. https://api.hustlethrough.com")]
        public string BaseUrl = "http://localhost:4000";

        private string _authToken;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void SetAuthToken(string token) => _authToken = token;

        public IEnumerator Post(string path, string jsonBody, Action<bool, string> onComplete)
        {
            var req = new UnityWebRequest(BaseUrl + path, "POST");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
            req.uploadHandler = new UploadHandlerRaw(bodyRaw);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            if (!string.IsNullOrEmpty(_authToken))
                req.SetRequestHeader("Authorization", "Bearer " + _authToken);

            yield return req.SendWebRequest();

            bool success = req.result == UnityWebRequest.Result.Success;
            onComplete?.Invoke(success, req.downloadHandler.text);
        }

        public IEnumerator Get(string path, Action<bool, string> onComplete)
        {
            var req = UnityWebRequest.Get(BaseUrl + path);
            if (!string.IsNullOrEmpty(_authToken))
                req.SetRequestHeader("Authorization", "Bearer " + _authToken);

            yield return req.SendWebRequest();

            bool success = req.result == UnityWebRequest.Result.Success;
            onComplete?.Invoke(success, req.downloadHandler.text);
        }
    }
}
