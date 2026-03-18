// src/services/tokenHelper.js
export const getToken = (key = "km_token") => {
    try {
        const token = localStorage.getItem(key);
        if (token) return token;

        if (key === "km_token") {
            const raw = localStorage.getItem("km_user");
            if (!raw) return "";
            const user = JSON.parse(raw);
            return (user && user.token) || "";
        }
        return "";
    } catch {
        return "";
    }
};