import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity,View} from 'react-native';
import { Slide } from '../utils/slideshow';
import { VideoTemplate } from '../templates/videoTemplates';
import Sound from 'react-native-sound';

type SlideshowPlayerProps = Readonly<{
  slides: Slide[];
  template: VideoTemplate;
}>;

function SlideshowPlayer({ slides, template }: SlideshowPlayerProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const musicRef = useRef<Sound | null>(null);

  //add music
useEffect(() => {
  const musicFiles: Record<string, string> = {
    wedding: 'wedding_music.mp3',
    college: 'college_music.mp3',
    travel: 'travel_music.mp3',
    birthday: 'birthday_music.mp3',
    bestfriends: 'friends_music.mp3',
  };

  const musicFile = musicFiles[template.id];

  if (!musicFile) {
    return;
  }

  const music = new Sound(
    musicFile,
    Sound.MAIN_BUNDLE,
    error => {
      if (error) {
        console.log('Failed to load music:', error);
        return;
      }

      music.setVolume(0.4);
      music.setNumberOfLoops(-1);
      music.play();
    },
  );

  musicRef.current = music;

  return () => {
    music.stop();
    music.release();
    musicRef.current = null;
  };
}, [template.id]);

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
      return;
    }

    // Fade the current slide out before moving
    // to the next one.
    Animated.timing(opacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setIndex(currentIndex => currentIndex + 1);
    });
  }, template.secondsPerPhoto * 1000);

  return () => clearTimeout(timer);
}, [
  index,
  playing,
  slides.length,
  template.secondsPerPhoto,
  opacity,
]);

  const replay = () => {
    setIndex(0);
    setPlaying(true);
  };

  const slide = slides[index];
  const textStyle = { color: template.textColor };
  const finished = !playing && index >= slides.length - 1;

  return (
    <View style={styles.container}>
    <Image
    source={template.backgroundImage}
    style={styles.backgroundImage}
    resizeMode="cover"
  />
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

  title: { fontSize: 30, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  photo: { width: '86%', height: 280, resizeMode: 'contain', borderRadius: 12,},
  caption: { marginTop: 4, fontSize: 18, textAlign: 'center' },
replay: {
  position: 'absolute',
  bottom: 320,
  alignSelf: 'center',
  borderWidth: 1,
  borderRadius: 8,
  paddingVertical: 10,
  paddingHorizontal: 24,
  backgroundColor: 'rgba(255, 255, 255, 0.75)',
},  replayText: { fontWeight: '800', letterSpacing: 1 },

container: {
  flex: 1,
  width: '100%',
  position: 'relative',
},

backgroundImage: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
},

slide: {
  flex: 1,
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 24,
},
});

export default SlideshowPlayer;