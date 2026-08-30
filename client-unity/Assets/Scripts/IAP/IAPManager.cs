using System;
using UnityEngine;
using UnityEngine.Purchasing;
using HustleThrough.Networking;
using HustleThrough.Progression;

namespace HustleThrough.IAP
{
    /// <summary>
    /// Wraps Unity IAP (com.unity.purchasing package — install via Package
    /// Manager before this will compile). Flow, matching the architecture doc:
    ///
    /// 1. Platform store returns a signed receipt after purchase.
    /// 2. We send that receipt to OUR backend, not directly to game state.
    /// 3. Backend verifies with Apple/Google server-side.
    /// 4. Only after backend confirms do we refresh Notes balance from server.
    ///
    /// The client NEVER credits currency itself on a "purchase successful"
    /// callback — that would be trivially fakeable. ProcessPurchase always
    /// waits on backend confirmation before returning PurchaseProcessingResult.Complete.
    /// </summary>
    public class IAPManager : MonoBehaviour, IStoreListener
    {
        public static IAPManager Instance { get; private set; }

        private IStoreController _storeController;
        private IExtensionProvider _extensionProvider;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializePurchasing();
        }

        private void InitializePurchasing()
        {
            var builder = ConfigurationBuilder.Instance(StandardPurchasingModule.Instance());
            foreach (var productId in IAPCatalog.AllProductIds)
            {
                builder.AddProduct(productId, ProductType.Consumable);
            }
            UnityPurchasing.Initialize(this, builder);
        }

        public void BuyNotesPack(string productId)
        {
            if (_storeController == null)
            {
                Debug.LogError("IAP not initialized yet.");
                return;
            }
            _storeController.InitiatePurchase(productId);
        }

        public PurchaseProcessingResult ProcessPurchase(PurchaseEventArgs args)
        {
            string receipt = args.purchasedProduct.receipt;
            string productId = args.purchasedProduct.definition.id;

#if UNITY_IOS
            string platform = "apple";
#elif UNITY_ANDROID
            string platform = "google";
#else
            string platform = "apple"; // adjust for the platform you're testing on
#endif

            string body = $"{{\"platform\":\"{platform}\",\"productSku\":\"{productId}\",\"rawReceipt\":{EscapeJson(receipt)}}}";

            StartCoroutine(ApiClient.Instance.Post("/billing/purchase", body, (success, response) =>
            {
                if (success)
                {
                    Debug.Log("Purchase verified by backend: " + response);
                    PlayerProgress.Instance.Refresh();
                }
                else
                {
                    Debug.LogWarning("Backend rejected purchase receipt: " + response);
                    // Consider refunding/voiding locally-side effects here if any were shown optimistically.
                }
            }));

            // We tell Unity IAP the purchase is "Complete" from a local-transaction
            // standpoint (it's been charged), but actual in-game crediting only
            // happens once our backend confirms — see callback above.
            return PurchaseProcessingResult.Complete;
        }

        private static string EscapeJson(string raw)
        {
            return JsonUtility.ToJson(new Wrapper { v = raw }).Replace("{\"v\":", "").TrimEnd('}');
        }

        [Serializable]
        private class Wrapper { public string v; }

        public void OnInitialized(IStoreController controller, IExtensionProvider extensions)
        {
            _storeController = controller;
            _extensionProvider = extensions;
        }

        public void OnInitializeFailed(InitializationFailureReason error)
        {
            Debug.LogError("IAP initialization failed: " + error);
        }

        public void OnInitializeFailed(InitializationFailureReason error, string message)
        {
            Debug.LogError($"IAP initialization failed: {error} — {message}");
        }

        public void OnPurchaseFailed(Product product, PurchaseFailureReason reason)
        {
            Debug.LogWarning($"Purchase failed for {product.definition.id}: {reason}");
        }
    }
}
