# Message Board Setup

The message board uses Firebase Auth and Cloud Firestore directly from Firebase Hosting. It does not require the Cloud Run API or a billing account for the app code.

## Firebase Console Steps

1. Enable Cloud Firestore for project `the-chewth`.
   - Open: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=the-chewth
   - Enable the API.
   - Then create the default Firestore database in production mode, location `nam5` or another US multi-region.

2. Enable Firebase Authentication providers.
   - Email/password.
   - Google.
   - Microsoft.

3. Create the owner account in Firebase Auth.
   - Email: `thechewth@thechewth.local`
   - Display name / username: `TheChewth`
   - Use the owner password provided outside source control.

4. Microsoft provider setup.
   - Firebase's Microsoft provider requires a Microsoft Entra/Azure app client ID and secret.
   - Add Firebase's callback URL from the provider setup screen into the Microsoft app redirect URIs.

## Deploy Rules And Indexes

After Firestore is enabled, run:

```powershell
& 'C:\Users\Shadow\AppData\Local\OpenAI\Codex\bin\node.exe' '.\node_modules\firebase-tools\lib\bin\firebase.js' deploy --only firestore:rules,firestore:indexes --project the-chewth
```

Then deploy Hosting:

```powershell
& 'C:\Users\Shadow\AppData\Local\OpenAI\Codex\bin\node.exe' '.\node_modules\firebase-tools\lib\bin\firebase.js' deploy --only hosting --project the-chewth
```

## Collections

- `forumThreads`: thread metadata and original thread text.
- `forumPosts`: root posts and replies.
- `forumProfiles`: reserved for user profile data.

Admin access is based on the authenticated email `thechewth@thechewth.local`.
