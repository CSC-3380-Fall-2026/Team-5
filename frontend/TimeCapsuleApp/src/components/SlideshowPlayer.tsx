import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Slide } from '../utils/slideshow';
import { VideoTemplate } from '../templates/videoTemplates';

type SlideshowPlayerProps = Readonly<{
  slides: Slide[];
  template: VideoTemplate;
}>;

function SlideshowPlayer({ slides, template }: SlideshowPlayerProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;

  // Fade each slide in when it changes
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: template.transitionMs,
      useNativeDriver: true,
    }).start();
  }, [index, opacity, template.transitionMs]);

  // Move to the next slide after the template's time, and stop at the end
  useEffect(() => {
    if (!playing) {
      return;
    }
    const timer = setTimeout(() => {
      if (index >= slides.length - 1) {
        setPlaying(false);
      } else {
        setIndex(index + 1);
      }
    }, template.secondsPerPhoto * 1000);
    return () => clearTimeout(timer);
  }, [index, playing, slides.length, template.secondsPerPhoto]);

  const replay = () => {
    setIndex(0);
    setPlaying(true);
  };

  const slide = slides[index];
  const textStyle = { color: template.textColor };
  const finished = !playing && index >= slides.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: template.backgroundColor }]}>
      <Animated.View style={[styles.slide, { opacity }]}>
        {slide.kind === 'title' ? (
          <>
            <Text style={[styles.title, textStyle]}>{slide.title}</Text>
            <Text style={textStyle}>{slide.subtitle}</Text>
          </>
        ) : null}

        {slide.kind === 'photo' ? (
          <>
            <Image source={{ uri: slide.uri }} style={styles.photo} />
            {template.showCaptions && slide.caption ? (
              <Text style={[styles.caption, textStyle]}>{slide.caption}</Text>
            ) : null}
          </>
        ) : null}

        {slide.kind === 'end' ? (
          <Text style={[styles.title, textStyle]}>{slide.title}</Text>
        ) : null}
      </Animated.View>

      {finished ? (
        <TouchableOpacity
          style={[styles.replay, { borderColor: template.textColor }]}
          onPress={replay}
        >
          <Text style={[styles.replayText, textStyle]}>REPLAY</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  slide: { alignItems: 'center', width: '100%' },
  title: { fontSize: 30, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  photo: { width: '100%', height: 360, resizeMode: 'contain' },
  caption: { marginTop: 12, fontSize: 18, textAlign: 'center' },
  replay: { marginTop: 24, borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  replayText: { fontWeight: '800', letterSpacing: 1 },
});

export default SlideshowPlayer;