import React from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";
export type ThemedTextProps = TextProps & {
    type?: "default" | "title" | "defaultSemiBold" | "subtitle" ;
};

export default function StyledText({children, type = "default", style, ...props}: ThemedTextProps) {
    /*
    Custom text component preloaded with app styles and with prebuilt type styles
    types: default (standard text), defaultSemiBold (bolder), subtitle (slightly larger and bold), title (huge)
    */
    return (
        <Text style={[styles[type], style as TextStyle,]}{...props}>
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
});