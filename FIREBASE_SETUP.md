# One-time Firebase setup for New Deals — shared password edition

After this setup, everyone can view the Atlas and shared New Deals without signing in. The team password is requested only when somebody adds, moves, or deletes a New Deal.

## 1. Web app configuration
Firebase Console > Project settings > Your apps > Web app > SDK setup and configuration. Copy the Firebase `firebaseConfig` values into `js/firebase-config.js`. Do not put the team password in this file.

## 2. Firestore
Create the `(default)` Cloud Firestore database if it does not already exist.

## 3. Authentication
Firebase Console > Authentication > Sign-in method:
- Enable **Email/Password**.
- Google sign-in is not needed for this version and may be disabled.

Then Authentication > Users > Add user:
- Email: `newdeals.shared@lennar.com`
- Password: use the team password chosen by the Atlas owner.

The email is only the internal Firebase editor identity; it does not need to be a mailbox.

## 4. Security rules
Firestore > Rules: paste `firestore.rules` and click Publish.

These rules allow anyone who can access the Atlas to read the New Deals collection, but only the shared editor account can add/update/delete. All other Firestore collections remain denied.

## 5. Publish the Atlas patch
Upload the v2.9.71 patch to the GitHub Pages repository.

## Normal workflow
- Viewing New Deals: no password or sign-in screen.
- Add Pin to Map: password prompt the first time editing during that browser session.
- Move Pin: drag the selected deal marker, release, and confirm the new location; the shared Firestore record updates immediately.
- Delete Pin: same session authorization is reused.
- Closing the browser session locks editing again.
- Changes appear live for all open Atlas sessions.
- KML download exports the shared Firestore collection.

## Important security note
The password is never stored in the GitHub repository or JavaScript. It is stored by Firebase Authentication. A shared password is less auditable than individual user accounts; change it in Firebase Authentication if it is ever distributed beyond the intended team.
