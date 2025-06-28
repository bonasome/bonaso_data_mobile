import theme from "@/themes/themes";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, TextProps, TextStyle } from "react-native";
export type ThemedLinkProps = TextProps & {
  type?: "default" | "big";
};

export default function StyledLink({
  children,
  type = "default",
  style,
  ...props
}: ThemedLinkProps) {
  return (
    <Link
      style={[
        styles[type],
        style as TextStyle,
      ]}
      {...props}
    >
      {children}
    </Link>
  );
}

const styles = StyleSheet.create({
  default: {
    color: theme.colors.bonasoUberLightAccent,
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: "600",
  },
  big: {
    color: theme.colors.bonasoUberLightAccent,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "600",
    textDecorationLine: 'underline',
  },
});