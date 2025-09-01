import { Stack } from "expo-router";
import StyledLink from "../components/styledLink";
import StyledScroll from "../components/styledScroll";

export default function NotFoundScreen() {
    /*
    Basic not found screen in case the user navigates to a bad page. Contains a link back to the home screen.
    */
    return (
        <>
        <Stack.Screen options={{ title: 'Oops! Not Found' }} />
            <StyledScroll >
                <StyledLink href="/">Go back to Home screen!</StyledLink>
            </StyledScroll>
        </>
    );
}