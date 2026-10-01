/**
 * Every word the QR sign-in screens say, in Sonar's voice (PING.md §9.14). The one
 * file in features/auth/qr that is not identical across the family: the screens are
 * the same everywhere, the voice is not.
 */
export const APP_NAME = 'Sonar';

/** The shape every app's copy takes, so the components can be identical. */
export type QrCopy = typeof QR_COPY;

export const QR_COPY = {
  // Settings
  showRowTitle: 'Sign in another device',
  showRowSub: 'Show a code for a signed-out phone to scan',
  scanRowTitle: 'Scan a code',
  scanRowSub: 'Let a browser or another phone in, once you have checked it is them',

  // Sign-in screen
  loginScan: 'Sign in with a QR code',
  loginShowOnWeb: 'Sign in with your phone',
  webTitle: 'Scan this with a signed-in Ping app',
  webHelp: `Open ${APP_NAME} on your phone, then Settings → Scan a code. Radar, Lidar, Sonar, Pulsar and Cellar all work.`,

  // The two screens
  scanTitle: 'Scan a code',
  showTitle: 'Sign in another device',
  scanHintSignedIn: 'Point the camera at the code on the screen you want to sign in',
  scanHintSignedOut: 'Point the camera at the code on your signed-in phone. It is under Settings → Sign in another device',
  showHint: `On the other phone, open ${APP_NAME} (or any Ping app) and choose Sign in with a QR code`,
  checking: 'Checking the code…',
  gettingCode: 'Getting a code…',
  signingIn: 'Signing you in…',

  // The camera
  cameraNeeded: `${APP_NAME} needs the camera to scan a sign-in code.`,
  cameraOff: `Camera access is off for ${APP_NAME}. Turn it on in your system settings.`,
  cameraAllow: 'Allow camera',

  // A real Ping code, scanned by the wrong side
  scannedPhoneCodeWhileSignedIn: 'That code signs in another phone. Scan it from that phone’s sign-in screen.',
  scannedBrowserCodeWhileSignedOut: 'Sign in on this phone first, then scan the browser’s code.',

  // The match code
  matchCode: 'Match code',
  matchHelpShowing: 'The screen you are signing in should show the same two digits.',
  matchHelpWaiting: 'Your signed-in phone should show the same two digits. Check, then approve there.',

  // The approving screen: the defence, so it says what it knows and what it does not
  approveTitle: 'Is this you signing in?',
  approveWarning: 'If the digits are not the same, or you did not start this, decline.',
  saysItIs: 'Says it is',
  seenFrom: 'Seen from',
  unknownCountry: 'Somewhere unknown',
  approve: 'Approve',
  decline: 'Decline',
  secondsLeft: (seconds: number) => `${seconds}s left`,

  // Waiting, on the side being signed in
  waitingTitle: 'Waiting for approval',

  // Endings
  approvedTitle: 'Signed in',
  approvedBody: 'That device is signing in now.',
  declinedTitle: 'Declined',
  declinedBody: 'Nothing was signed in.',
  deniedTitle: 'Declined',
  deniedBody: 'The other phone said no.',
  expiredTitle: 'That code ran out',
  expiredBody: 'Codes only last a minute. Get a new one and try again.',
  failedTitle: 'That did not work',
  failedBody: 'Something went wrong. Try again.',
  tryAgain: 'Try again',
  newCode: 'Show a new code',
  scanAnother: 'Scan another',
  done: 'Done',
  cancel: 'Cancel',
  back: 'Back',
};
