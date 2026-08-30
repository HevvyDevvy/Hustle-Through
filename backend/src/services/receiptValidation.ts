import fetch from "node-fetch";

/**
 * Server-side receipt validation. The client NEVER gets to just say
 * "purchase succeeded, credit me" — every receipt is checked against the
 * platform's own verification endpoint before anything is credited.
 */

interface VerificationResult {
  valid: boolean;
  productId?: string;
  raw?: unknown;
}

export async function verifyAppleReceipt(receiptData: string): Promise<VerificationResult> {
  const sharedSecret = process.env.APPLE_SHARED_SECRET;
  const body = JSON.stringify({
    "receipt-data": receiptData,
    password: sharedSecret,
    "exclude-old-transactions": true,
  });

  // Always try production first; Apple's docs say to fall back to sandbox on
  // status 21007 (a sandbox receipt was sent to the production endpoint).
  const prodRes = await fetch(process.env.APPLE_VERIFY_URL_PROD!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const prodJson: any = await prodRes.json();

  if (prodJson.status === 21007) {
    const sandboxRes = await fetch(process.env.APPLE_VERIFY_URL_SANDBOX!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const sandboxJson: any = await sandboxRes.json();
    return {
      valid: sandboxJson.status === 0,
      productId: sandboxJson.receipt?.in_app?.[0]?.product_id,
      raw: sandboxJson,
    };
  }

  return {
    valid: prodJson.status === 0,
    productId: prodJson.receipt?.in_app?.[0]?.product_id,
    raw: prodJson,
  };
}

export async function verifyGoogleReceipt(
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<VerificationResult> {
  // NOTE: real implementation needs an OAuth2 access token minted from the
  // service account JSON (GOOGLE_SERVICE_ACCOUNT_JSON_PATH) via the
  // google-auth-library package, then calls:
  // GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/
  //     {packageName}/purchases/products/{productId}/tokens/{purchaseToken}
  // This stub shows the shape; wire in google-auth-library before going live.
  throw new Error(
    "verifyGoogleReceipt not yet wired to a live service account — see comment for the real call to make."
  );
}
