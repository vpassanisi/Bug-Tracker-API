import { writable } from "svelte/store";
import { push } from "svelte-spa-router";
import { bugs } from "./bugs";

function account() {
  const { subscribe, set, update } = writable(false);

  async function getMe() {
    // try {
    const req = await fetch("http://10.0.0.75:5500/api/v1/auth/me", {
      method: "GET",
      credentials: "include"
    });

    const res = await req.json();

    if (res.success) {
      set(true);
      push("/projects");
    } else {
      M.toast({ html: `${res.error}`, classes: "red" });
      push("/login");
      set(false);
    }
    // } catch (err) {
    //   set(false);
    //   push("/login");
    // }
  }

  async function login(body) {
    try {
      const req = await fetch("http://10.0.0.75:5500/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });

      const res = await req.json();

      if (res.success) {
        set(true);
        push("/projects");
      } else {
        M.toast({ html: `${res.error}`, classes: "red" });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function logout() {
    try {
      const req = await fetch("http://10.0.0.75:5500/api/v1/auth/logout", {
        method: "GET",
        credentials: "include"
      });

      const res = await req.json();

      if (res.success) {
        bugs.clearBugs();
        set(false);
        push("/login");
      } else {
        M.toast({ html: `${res.error}`, classes: "red" });
      }
    } catch (err) {
      M.toast({ html: `${err}`, classes: "red" });
    }
  }

  async function createUser(userBody) {
    try {
      const req = await fetch("http://10.0.0.75:5500/api/v1/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userBody)
      });

      const res = await req.json();

      if (res.success) {
        set(true);
        push("/projects");
      }
    } catch (err) {
      console.log(err);
    }
  }

  return {
    subscribe,
    set,
    update,
    getMe: getMe,
    login: login,
    logout: logout,
    createUser: createUser
  };
}

export const login = account();
