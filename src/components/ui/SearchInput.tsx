import { forwardRef } from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

// Every search field routes through this (doc 12 part 1: model the difference as
// a prop on one component, never as another copy of the markup).
//
// Android EditText reserves extra room above and below the glyphs for font
// ascent/descent and defaults to textAlignVertical 'auto', which does not
// centre. In a fixed-height field (the library and facet search boxes) that
// reads as text sitting low in its box. Dropping the font padding and centring
// explicitly puts the text where the border says it should be, and leaves each
// field's own padding classes alone.
const ANDROID_TEXT_METRICS = Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' as const } : null;

// The font size lives here rather than in each caller's `text-sm`, because
// NativeWind's text utilities emit a `lineHeight` alongside the size and an
// explicit lineHeight on an Android TextInput (with includeFontPadding off)
// clips descenders in a short fixed-height field. Setting the size inline, with
// no line height, keeps the glyph box the same box the border draws. Callers can
// still override through their own `style`; padding classes are untouched.
const TEXT_STYLE = { fontSize: 14, lineHeight: undefined };

export const SearchInput = forwardRef<TextInput, TextInputProps>(function SearchInput({ style, ...props }, ref) {
  return <TextInput ref={ref} {...ANDROID_TEXT_METRICS} {...props} style={[TEXT_STYLE, style]} />;
});
