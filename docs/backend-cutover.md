# Dedicated Ping backend — Sonar 2.4.1

Pulsar's Android cutover is user-verified. Sonar 2.4.2 prepares reciprocal
same-backend handoff with Pulsar; its own Android/web release checks remain
pending. Bazaar stays on cloud, and Radar/Cellar remain excluded.

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
