# Gulf Coast Submarket Atlas v2.9.91

New Deals are now private. The layer, deal list, and deal pins stay hidden until the shared New Deals password is entered. Once unlocked, the same Firebase session authorizes viewing, adding, moving, deleting, and opening Market Preview shortcuts for New Deals.

IMPORTANT: Publish the included Firestore rule snippet before deploying this patch. Replace the existing `match /newDeals/{dealId}` rule with the private rule in `firestore-new-deals-private.rules.txt` (or merge it into your existing rules). This is what prevents unauthenticated users from reading the New Deals collection directly.

The shared Firebase editor identity remains `newdeals.shared@lennar.com`; the team password is entered only through the Atlas password prompt and is not embedded in the GitHub code.


2.9.91: fixed deployment script reference so the private New Deals authentication flow is actually loaded; New Deals count remains visible while locked.
