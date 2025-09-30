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
  return localStorage.getItem("chat_room_token");
};

export const setToken = (token: string) => {
  localStorage.setItem("chat_room_token", token);
};

export const removeToken = () => {
  localStorage.removeItem("chat_room_token");
};
