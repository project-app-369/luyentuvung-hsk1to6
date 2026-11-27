# Firebase — HSK Vocabulary

Project: `hsk-vocab-da150`. The client supports Google and email/password. Both providers and the GitHub Pages authorized domain have been verified in Firebase Console. The `(default)` Firestore database exists in `asia-southeast1`; the project is on Spark.

## Private progress

Documents live at `users/{uid}/courses/hsk-studio-v1-946df900/items/{itemId}`. Only that authenticated UID can read or write. All other paths and document deletion are denied. The rules also validate record kinds, fields, note lengths, goal values and server timestamps. The published rules are preserved in `firestore.rules`.

Records cover HSK words, supplemental items, daily activity, review schedules, notes, goals, last word and test results. Changes merge by field with deterministic timestamps/device IDs; daily activity is a union. Pending changes survive browser restarts and retry when online. Guest and signed-in account data are stored separately. Importing guest progress at login is optional. Appearance remains a device preference.

The Firebase web configuration in `src/firebase-config.json` is public client configuration, not an admin credential. Security depends on Authentication and the deployed Firestore rules. No Analytics SDK is initialized. SDK assets are bundled locally and included in the PWA cache; initial authentication requires a connection.

## Updating rules

Use the Firebase Console Rules editor, or run the official Firebase CLI from this directory after signing in:

```sh
firebase deploy --only firestore:rules --project hsk-vocab-da150
```

Keep the owner-only rule boundary. Do not switch the database to public test rules.

## Verification

- Firebase Rules Playground: anonymous read denied; owner read allowed; different UID denied.
- Anonymous production REST read: permission denied.
- Pure merge tests: independent fields, tie breaks, clears, activity unions, offline restarts, invalid records and in-flight updates.
- Browser integration with a mock Firebase transport: Google/email UI, two devices, concurrent notes/favorites, offline replay, account separation and popup errors. These tests do not create production test users or send password-reset emails.

Firebase JavaScript SDK: 13.4.0 (Apache 2.0). Client bundle license files accompany the deployed assets.
