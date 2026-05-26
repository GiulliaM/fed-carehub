import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const PressableAnimated = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<React.ComponentProps<typeof Pressable>, "style"> {
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  children?: React.ReactNode;
}

export function AnimatedPressable({
  style,
  activeOpacity,
  children,
  onPressIn,
  onPressOut,
  ...props
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <PressableAnimated
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        onPressOut?.(e);
      }}
      {...props}
    >
      {children}
    </PressableAnimated>
  );
}

export default AnimatedPressable;
