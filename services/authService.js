let signOutFn = null;

//helper functions used by the auth context
export const AuthService = {
    setSignOut(fn) {
        signOutFn = fn;
    },

    signOut() {
        if (signOutFn) signOutFn();
    },
};