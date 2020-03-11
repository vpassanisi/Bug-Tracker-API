import { writable } from "svelte/store";
import { push } from "svelte-spa-router";
import { bugs } from "./bugs";
import { baseUrl } from "./_baseUrl.js";

function account() {
  const { subscribe, set, update } = writable(false);

  async function getMe() {
    const req = await fetch(`${baseUrl}/api/v1/auth/me`, {
      method: "GET",
      credentials: "include"
    });

    const res = await req.json();

    if (res.success) {
      set(true);
      push("/projects");
    } else {
      set(false);
    }
  }

  async function login(body) {
    const req = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    const res = await req.json();

    if (res.success) {
      set(true);
      push("/projects");
    } else if (!res.success) {
      M.toast({ html: `${res.error}`, classes: "red" });
    }
  }

  async function logout() {
    try {
      const req = await fetch(`${baseUrl}/api/v1/auth/logout`, {
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
    const req = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userBody)
    });

    const res = await req.json();

    if (res.success) {
      set(true);
      push("/projects");
    } else if (!res.success) {
      res.error.forEach(err => M.toast({ html: `${err}`, classes: "red" }));
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
