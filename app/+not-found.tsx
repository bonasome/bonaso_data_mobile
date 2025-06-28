import { Stack } from "expo-router";
import StyledLink from "../components/styledLink";
import StyledScroll from "../components/styledScroll";

export default function NotFoundScreen() {
    return (
        <>
        <Stack.Screen options={{ title: 'Oops! Not Found' }} />
            <StyledScroll >
                <StyledLink href="/">Go back to Home screen!</StyledLink>
            </StyledScroll>
        </>
    );
}