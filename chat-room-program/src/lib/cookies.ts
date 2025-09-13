import Cookies from "universal-cookie";

export const cookies = new Cookies({ path: "/" });

export const getCookie = (name: string) => {
  const cookie = cookies.get(name);
  return cookie;
};

export const setCookie = (name: string, value: string) => {
  cookies.set(name, value);
};

export const removeCookie = (name: string) => {
  cookies.remove(name);
};

export const getToken = () => {
  return getCookie("chat_room_token");
};

export const setToken = (token: string) => {
  setCookie("chat_room_token", token);
};

export const removeToken = () => {
  removeCookie("chat_room_token");
};
