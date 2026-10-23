# Sign-in setup: email, Google, Apple

What a project owner sets up outside the code. Each part is OFF until its
settings exist, and the apps hide what is off. `GET /api/auth/options` says
what is on:

```json
{ "passwordResetEnabled": false, "registrationEnabled": false, "providers": [] }
```

Keys go into the environment's settings, never into a commit. Client ids are
not secrets; `RESEND_API_KEY` is.

## 1. Email: password reset and confirming an address

1. Make an account at resend.com and add a sending subdomain (for example
   `mail.example.com`). Add the DNS records Resend shows and wait until it
   marks the domain verified; without that, mail lands in spam.
2. Create an API key with "Sending access" only.
3. API environment: `RESEND_API_KEY` (the key) and `MAIL_FROM`
   (`Example <no-reply@mail.example.com>`, on the verified domain). Mail is on
   only when both are set; half a setup leaves it off and the API still starts.
4. `WEB_APP_URL` must be the dashboard's address: the emailed links open there.

Check: `passwordResetEnabled` is `true`, and "Forgot password?" shows on both
sign-in screens.

## 2. Google sign-in

The app shows Google's own account sheet (`@react-native-google-signin`), not
a browser window. It cannot be tried in the web preview; the first real check
is a phone.

1. Google Cloud console → APIs & Services → OAuth consent screen. Fill it in
   and publish it.
2. Credentials → Create credentials → OAuth client ID, type **Web
   application**, no redirect addresses. Its id is "the Web id" below.
3. Another one, type **Android**: the app's package name and the SHA-1 of the
   key the installed app is signed with — for Play installs, Play Console →
   App integrity → App signing key certificate. Its id is entered nowhere; it
   only has to exist in the same project. A build installed from a file is
   signed with the upload key instead; give that SHA-1 its own Android client.
4. For iPhone, a third one, type **iOS**, with the bundle id. Then add the
   library's plugin to `apps/mobile/app.json`, with this client's reversed id
   (`com.googleusercontent.apps.000-ios`) as `iosUrlScheme`:

   ```json
   ["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.000-ios" }]
   ```

   The plugin is not in `app.json` by default because it refuses to run
   without that value.
5. API environment: `AUTH_GOOGLE_CLIENT_ID` = the Web id (add the iOS id after
   a comma).
6. App build (expo.dev → Environment variables): `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
   = the Web id, and for iPhone `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` = the iOS id.

Check: `providers` lists `google`, and the app's sign-in screen shows
"Continue with Google". A sheet that closes with `DEVELOPER_ERROR` on Android
means the package name or SHA-1 does not match the build.

## 3. Apple sign-in

1. API environment: `AUTH_APPLE_CLIENT_ID` = the app's bundle id.
2. Nothing in the app build. `app.json` already asks for the capability
   (`usesAppleSignIn` and the `expo-apple-authentication` plugin), so the
   first iOS build turns it on for the app id.

The button shows on iPhone only. App Store rule: an iOS app that offers
Google sign-in must offer Apple's too, so on iPhone turn both on together.

## How it behaves

- **Identity is the provider's `sub`, never the email** (`user_identity`).
  Apple's relay addresses change and Google Workspace addresses get reused.
- **A known Apple or Google account** signs in to the account it is linked to,
  in its first organization, like a password login.
- **A new one whose address the provider verified, held by an existing
  account,** is linked to that account: one person, one account. If that
  account's address was never confirmed, it is now, and the password it was
  made with stops working and its sessions end — whoever chose that password
  never proved the address was theirs.
- **Platform admins** (`systemRole` other than `USER`) are never linked: they
  sign in with their password, so a provider login to their mailbox is not a
  way into the platform.
- **Anyone else** gets a new account with an organization of its own, as
  `POST /auth/register` makes — only while `AUTH_REGISTRATION_ENABLED=true`.
  With sign-up closed, only existing accounts can use the buttons.
- **No password.** A provider-made account holds a marker no password
  matches. "Forgot password?" can give it one. To delete it, the app asks for
  a fresh sign-in with a linked provider instead of a password.
- **Disabled accounts** are refused, as with a password.

## Copied tokens — nothing to set up

- **Each token works once.** Its hash is kept in Redis until it expires
  (`iam:provider-token:*`); the same token again is refused.
- **Apple's token carries our nonce.** The app asks `POST
  /api/auth/provider/nonce`, gives it to Apple, and sends it with the token.
  The server checks the token has that exact value and spends it (one use, 10
  minutes). An Apple token without one is refused.
- **Google:** the free native sheet cannot carry a nonce, so a Google token
  without one relies on the one-use check. A Google token that does carry one
  (a web sign-in can) is held to the same rule as Apple's.
- Every failure gets the same answer; which check failed goes to the log only.
