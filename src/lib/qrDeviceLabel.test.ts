import { countryName, deviceLabel } from './qrDeviceLabel';

const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const EDGE_WINDOWS = `${CHROME_WINDOWS} Edg/126.0.0.0`;
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0';
const SAFARI_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

describe('deviceLabel', () => {
  it('names the app and the system on a phone', () => {
    expect(deviceLabel('Lidar', 'android')).toBe('Lidar on Android');
    expect(deviceLabel('Lidar', 'ios')).toBe('Lidar on iOS');
  });

  it('names the browser and the system on the web', () => {
    expect(deviceLabel('Radar', 'web', CHROME_WINDOWS)).toBe('Radar in Chrome on Windows');
    expect(deviceLabel('Radar', 'web', FIREFOX_LINUX)).toBe('Radar in Firefox on Linux');
    expect(deviceLabel('Radar', 'web', SAFARI_MAC)).toBe('Radar in Safari on macOS');
  });

  it('tells Edge from the Chrome it is built on', () => {
    expect(deviceLabel('Radar', 'web', EDGE_WINDOWS)).toBe('Radar in Edge on Windows');
  });

  it('reads a phone browser as the phone, not as Linux or macOS', () => {
    expect(deviceLabel('Radar', 'web', CHROME_ANDROID)).toBe('Radar in Chrome on Android');
    expect(deviceLabel('Radar', 'web', SAFARI_IPHONE)).toBe('Radar in Safari on iOS');
  });

  it('says what it can when the user agent is missing or strange', () => {
    expect(deviceLabel('Radar', 'web')).toBe('Radar in a browser');
    expect(deviceLabel('Radar', 'web', 'curl/8.0')).toBe('Radar in a browser');
    expect(deviceLabel('Radar', 'web', 'Linux; something')).toBe('Radar on Linux');
    expect(deviceLabel('Radar', 'windows')).toBe('Radar');
  });
});

describe('countryName', () => {
  it('returns a name, or nothing, but never throws', () => {
    const name = countryName('PL', 'en');
    expect(name === null || typeof name === 'string').toBe(true);
    expect(countryName('not a code')).toBeNull();
  });
});
