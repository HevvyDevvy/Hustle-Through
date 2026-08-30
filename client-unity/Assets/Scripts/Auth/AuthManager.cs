using System;
using UnityEngine;
using HustleThrough.Networking;

namespace HustleThrough.Auth
{
    [Serializable]
    public class LoginRequest
    {
        public string email;
        public string password;
    }

    [Serializable]
    public class PlayerDto
    {
        public string id;
        public int rank;
        public int level;
        public long cash_balance;
        public long notes_balance;
    }

    [Serializable]
    public class AuthResponse
    {
        public string token;
        public PlayerDto player;
    }

    public class AuthManager : MonoBehaviour
    {
        public static AuthManager Instance { get; private set; }
        public PlayerDto CurrentPlayer { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void Login(string email, string password, Action<bool, string> onComplete)
        {
            var payload = JsonUtility.ToJson(new LoginRequest { email = email, password = password });
            StartCoroutine(ApiClient.Instance.Post("/auth/login", payload, (success, body) =>
            {
                if (success)
                {
                    var response = JsonUtility.FromJson<AuthResponse>(body);
                    ApiClient.Instance.SetAuthToken(response.token);
                    CurrentPlayer = response.player;
                    // Persist token securely — PlayerPrefs is NOT secure storage;
                    // use platform keychain/keystore APIs for a production build.
                    PlayerPrefs.SetString("auth_token", response.token);
                }
                onComplete?.Invoke(success, body);
            }));
        }

        public void Register(string email, string password, string displayName, Action<bool, string> onComplete)
        {
            string payload = $"{{\"email\":\"{email}\",\"password\":\"{password}\",\"displayName\":\"{displayName}\"}}";
            StartCoroutine(ApiClient.Instance.Post("/auth/register", payload, (success, body) =>
            {
                if (success)
                {
                    var response = JsonUtility.FromJson<AuthResponse>(body);
                    ApiClient.Instance.SetAuthToken(response.token);
                    CurrentPlayer = response.player;
                    PlayerPrefs.SetString("auth_token", response.token);
                }
                onComplete?.Invoke(success, body);
            }));
        }
    }
}
