import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import React from "react";

const Terms = ({ styles, setShowTerms, showGoofyAnimation, theme, insets }) => {
  return (
    <View
      style={[
        styles.termsModalContainer,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.termsHeader}>
        <Text
          style={[
            styles.text,
            {
              fontWeight: "bold",
              color: theme.textPrimary,
            },
          ]}
        >
          Terms & Conditions
        </Text>
        <TouchableOpacity
          style={styles.termsCloseButton}
          onPress={() => {
            setShowTerms(false);
            showGoofyAnimation();
          }}
        >
          <Ionicons name="close" size={30} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.termsScrollView}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.termsText, { color: theme.textPrimary }]}>
          1. By using VibeLink, you agree to send at least one text message a
          day that could confuse even Sherlock Holmes.{"\n\n"} Bonus points for
          sending it with an image that makes it even weirder. 🕵️‍♂️💬🖼️{"\n\n"} 2.
          You promise to share images that spread joy, confusion, or both.
          {"\n\n"} If your image causes someone to laugh-snort, you win the day.
          😂📸🎉{"\n\n"} 3. Sharing blurry photos “accidentally” is completely
          acceptable. {"\n\n"} We call it artistic expression, and we’re here
          for it. 🎨📷✨ {"\n\n"} 4. You agree to use captions that make people
          go, “Wait, what?” every once in a while.{"\n\n"} It’s good for the
          vibe. 🤔🖼️📜{"\n\n"} 5. If you send the wrong image to the wrong
          person, you must laugh it off and pretend it was intentional.{"\n\n"}{" "}
          It’s the VibeLink way. 🤷‍♀️📱😂{"\n\n"} 6. By using this app, you agree
          to embrace the beauty of typos in your messages.{"\n\n"} They’re not
          mistakes; they’re personality quirks. 😜✍️✨{"\n\n"} 7. Posting
          pictures of food that look way too good to eat is allowed, but you’ll
          need to send the recipe too.{"\n\n"} Sharing is caring. 🍕📸🍴{"\n\n"}{" "}
          8. By using VibeLink, you promise not to use the app to send cryptic
          texts like “We need to talk” unless you’re also sending a picture of
          something harmless, like a kitten.{"\n\n"} 🐱💬💓{"\n\n"} 9. You agree
          to celebrate your friends’ blurry sunset photos like they’re
          professional photographers.{"\n\n"} It’s about the vibes, not the
          megapixels. 🌅📷💖{"\n\n"} 10. Sharing an image of your coffee? Cool.
          {"\n\n"} But remember: the more ridiculous the caption, the better.
          ☕😂🖋️ {"\n\n"} 11. Any overuse of filters must be accompanied by a
          caption that says, “Yes, this is 100% real and not filtered at all.”
          {"\n\n"} Honesty is key. 😇📸🎨
          {"\n\n"} 12. You promise not to ghost your group chats.{"\n\n"} If you
          go quiet for too long, you owe them a picture of something random in
          your house.{"\n\n"} Bonus points for creativity. 🏠📷💬
          {"\n\n"} 13. By agreeing to these terms, you understand that sending a
          single text without an accompanying image is totally acceptable—but
          slightly less vibey.{"\n\n"} Try to balance it out. ⚖️🖼️💬{"\n\n"}
          14. VibeLink reserves the right to cheer you up with random image
          suggestions if your vibes seem off.{"\n\n"} We can’t help it; we care
          too much. 💖📱🎭{"\n\n"} 15. By using this app, you acknowledge that
          sometimes the best way to say something is to not say anything at all
          and just send a perfectly random image instead.{"\n\n"} 🖼️🤔🌈{"\n\n"}
        </Text>
      </ScrollView>
    </View>
  );
};

export default Terms;
