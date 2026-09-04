/// <reference types="nativewind/types" />

// Side-effect CSS imports (NativeWind global stylesheet). Resolves the
// long-standing TS2882 on `import '@/global.css'` in the root layout.
declare module '*.css';

// `.svg` imports resolve to React components via react-native-svg-transformer.
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: FC<SvgProps>;
  export default content;
}
