import { writable } from "svelte/store";

function bugsFunc() {
  const { subscribe, set, update } = writable(null);

  async function loadBugs() {
    const req = await fetch(
      "https://bug-tracker-api.herokuapp.com/api/v1/bugs/project",
      {
        method: "GET",
        credentials: "include"
      }
    );

    const res = await req.json();

    if (res.success) {
      update(n => res.data.bugs);
    }
  }

  async function newBug(body) {
    const req = await fetch(
      "https://bug-tracker-api.herokuapp.com/api/v1/bugs",
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const res = await req.json();

    if (res.success) {
      update(n => {
        n = [res.data, ...n];
        return n;
      });
      return true;
    } else {
      M.toast({ html: `${res.error}`, classes: "red" });
      return res;
    }
  }

  async function deleteBug(id, i) {
    const req = await fetch(
      `https://bug-tracker-api.herokuapp.com/api/v1/bugs/${id}`,
      {
        method: "DELETE",
        credentials: "include"
      }
    );

    const res = await req.json();

    if (res.success) {
      update(n => {
        n.splice(i, 1);
        return n;
      });
      return true;
    } else {
      return res;
    }
  }

  async function editBug(editBody, id, i) {
    const req = await fetch(
      `https://bug-tracker-api.herokuapp.com/api/v1/bugs/${id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editBody)
      }
    );

    const res = await req.json();

    if (res.success) {
      update(n => {
        n[i] = res.data;
        return n;
      });
      return true;
    } else {
      return res;
    }
  }

  function sortBugs(sortBy) {
    update(n => {
      let sorted = [...n].sort((bug, nextBug) => {
        let X;
        let Y;
        sortBy === "reporter" || sortBy === "fixer"
          ? (X = bug[sortBy].name.toUpperCase())
          : (X = bug[sortBy].toUpperCase());
        sortBy === "reporter" || sortBy === "fixer"
          ? (Y = nextBug[sortBy].name.toUpperCase())
          : (Y = nextBug[sortBy].toUpperCase());
        if (X > Y) return 1;
        if (X < Y) return -1;
        return 0;
      });

      let wasChanged = false;
      n.forEach((bug, index) => {
        if (bug !== sorted[index]) wasChanged = true;
      });

      if (!wasChanged) sorted = sorted.reverse();

      return (n = sorted);
    });
  }

  function clearBugs() {
    update(n => (n = null));
  }

  return {
    subscribe,
    loadBugs: loadBugs,
    newBug: newBug,
    deleteBug: deleteBug,
    editBug: editBug,
    clearBugs: clearBugs,
    sortBugs: sortBugs
  };
}

export const bugs = bugsFunc();
