import * as Linking from 'expo-linking';
import { Text, View } from 'react-native';

import { parseMarkdown, type InlineToken } from '@/lib/releaseNotes';
import { COLORS } from '@/theme/colors';

// Tokens deliberately set no colour of their own (links aside) - nested Text
// inherits from the block wrapper, so a heading stays heading-coloured.
function Inline({ tokens }: { tokens: InlineToken[] }) {
  return (
    <>
      {tokens.map((token, index) => {
        if (token.url) {
          return (
            <Text key={index} style={{ color: COLORS.accent }} onPress={() => void Linking.openURL(token.url!)}>
              {token.text}
            </Text>
          );
        }
        if (token.code) {
          return (
            <Text key={index} style={{ fontFamily: 'monospace' }}>
              {token.text}
            </Text>
          );
        }
        if (token.bold) {
          return (
            <Text key={index} className="font-semibold">
              {token.text}
            </Text>
          );
        }
        return <Text key={index}>{token.text}</Text>;
      })}
    </>
  );
}

export function ReleaseNotes({ body }: { body: string }) {
  const blocks = parseMarkdown(body);
  if (!blocks.length) return null;

  return (
    <View className="gap-1.5">
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          return (
            <Text key={index} className="pt-1 text-sm font-bold text-card-foreground">
              <Inline tokens={block.tokens} />
            </Text>
          );
        }
        if (block.kind === 'bullet') {
          return (
            <View key={index} className="flex-row gap-2 pl-1">
              <Text className="text-sm text-muted-foreground">•</Text>
              <Text className="flex-1 text-sm text-muted-foreground">
                <Inline tokens={block.tokens} />
              </Text>
            </View>
          );
        }
        return (
          <Text key={index} className="text-sm text-muted-foreground">
            <Inline tokens={block.tokens} />
          </Text>
        );
      })}
    </View>
  );
}
