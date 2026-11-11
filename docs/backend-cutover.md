# Dedicated Ping backend — Sonar 2.4.3

Sonar 2.4.3/code 10 enables sign-in with Bazaar after its migration to Ping.
The signed APK is installed in place; actual native handoff passed in both
directions using app-local sign-out. All 367 tests, lint, TypeScript, signature
and secret checks pass. All 24 web files match the existing Firebase site.
Radar and Cellar remain excluded. PR #21 stays open and unmerged.

## Earlier 2.4.2 release

Pulsar's Android cutover is user-verified. Sonar 2.4.2/code 9 enables reciprocal
same-backend handoff with Pulsar. Actual handoff passed in both directions on
Android using app-local sign-out. The signed update installed in place and
launched without errors. All 367 tests, lint/types, family-signature and secret
checks pass; all 24 web files match the existing Firebase site. Bazaar stays on
cloud, Radar/Cellar remain excluded, and PR #21 stays open and unmerged.

## Original 2.4.1 cutover

Android 2.4.1 (code 8) and https://sonar-tracker.web.app use
https://ping-api.dakowicz.xyz. The new auth storage key asks for a fresh sign-in
after updating while preserving the existing account UUID and album data.

Spotify catalogue requests go through an authenticated server function. It
validates a live user, permits only bounded metadata endpoints on fixed Spotify
hosts, rejects redirects and restricts web CORS to Sonar's sites. App credentials
and Spotify tokens stay on the server. The previously exposed credential was
rotated and is rejected for new token issuance. No Spotify user-library or
playback permissions are requested.

Sonar's cloud tables are fenced so old clients must update before saving. The
final consistent comparison matched, allowing a cutover without importing or
replacing application rows. Existing Lidar data, shared preferences and Auth
state were preserved. Backups and detailed operational receipts are retained
privately by the operator. After local writes begin, rollback requires pausing
affected writers and reconciling deltas; changing the URL alone is unsafe.

Ping consists of Lidar, Sonar, Pulsar and Bazaar. Local Lidar/Sonar sign-in
requires the matching Lidar update. Pulsar/Bazaar remain cloud clients and are
blocked from cross-backend handoff. Radar and Cellar are separate products.

Validation: 370 tests, lint, TypeScript, web export and nine offline function
scenarios pass. Android sign-in, album display and search were verified on the
device. Live RLS, same-account Auth, shared RPC, handoff/replay, full QR flow and
authenticated Realtime delivery pass. The signed APK matches the existing family
certificate; actual-secret scans pass, and every exported web file matches live
bytes. Interactive web Google sign-in was not separately exercised.
