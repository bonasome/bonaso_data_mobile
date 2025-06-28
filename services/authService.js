let signOutFn = null;

export const AuthService = {
    setSignOut(fn) {
        signOutFn = fn;
    },

    signOut() {
        if (signOutFn) signOutFn();
    },
};