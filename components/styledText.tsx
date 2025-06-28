import theme from "@/themes/themes";
import React from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";
export type ThemedTextProps = TextProps & {
    type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link" | "darkSemiBold";
};

export default function StyledText({
    children,
    type = "default",
    style,
    ...props
    }: ThemedTextProps) {
    return (
        <Text
        style={[
            styles[type], // cleaner switch
            style as TextStyle,
        ]}
        {...props}
        >
        {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    default: {
        color: '#fff',
        fontSize: 14,
    },
    defaultSemiBold: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 24,
        fontWeight: "600",
    },
    darkSemiBold: {
        color: theme.colors.bonasoUberDarkAccent,
        fontSize: 15,
        lineHeight: 24,
        fontWeight: "600",
    },
    title: {
        color: '#fff',
        fontSize: 32,
        fontWeight: "bold",
        lineHeight: 32,
    },
    subtitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: "bold",
    },
    link: {
        color: '#fff',
        lineHeight: 30,
        fontSize: 16,
    },
});