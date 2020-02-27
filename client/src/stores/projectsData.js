import { writable } from "svelte/store";

function projectsFunc() {
  const { subscribe, set, update } = writable([]);

  async function getProjects() {
    try {
      const req = await fetch(
        "https://bug-tracker-api.herokuapp.com/api/v1/projects/getProjects",
        {
          method: "GET",
          credentials: "include"
        }
      );

      const res = await req.json();

      if (res.success) {
        update(n => res.data);
      } else {
        M.toast({ html: `${res.error}`, classes: "red" });
      }
    } catch (err) {
      console.log(err);
      M.toast({ html: `${err}`, classes: "red" });
    }
  }

  async function getProjectInfo() {
    const req = await fetch(
      "https://bug-tracker-api.herokuapp.com/api/v1/projects/getProject",
      {
        method: "GET",
        credentials: "include"
      }
    );

    const res = await req.json();

    return res;
  }

  async function setProject(id) {
    try {
      const req = await fetch(
        `https://bug-tracker-api.herokuapp.com/api/v1/projects/${id}`,
        {
          method: "GET",
          credentials: "include"
        }
      );

      const res = await req.json();

      return res;
    } catch (err) {
      M.toast({ html: `${err}`, classes: "red" });
    }
  }

  async function deleteProject(id, index) {
    const req = await fetch(
      `https://bug-tracker-api.herokuapp.com/api/v1/projects/${id}`,
      {
        method: "GET",
        credentials: "include"
      }
    );

    const res = await req.json();

    if (!res.success) return console.log(res);

    const deleteReq = await fetch(
      "https://bug-tracker-api.herokuapp.com/api/v1/projects",
      {
        method: "DELETE",
        credentials: "include"
      }
    );

    const deleteRes = await deleteReq.json();

    if (deleteRes.success) {
      update(n => {
        n.splice(index, 1);
        return n;
      });
    }
  }

  async function newProject(newProjectBody) {
    try {
      const req = await fetch(
        "https://bug-tracker-api.herokuapp.com/api/v1/projects",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProjectBody)
        }
      );

      const res = await req.json();

      return res;
    } catch (err) {
      M.toast({ html: `${err}`, classes: "red" });
    }
  }

  async function editProject(project, index) {
    const req = await fetch(
      "https://bug-tracker-api.herokuapp.com/api/v1/projects",
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project)
      }
    );

    const res = await req.json();

    if (res.success) {
      update(n => {
        n[index] = res.data;
        return n;
      });
    } else {
      M.toast({ html: `${res.error}`, classes: "red" });
    }
  }

  return {
    subscribe,
    getProjects: getProjects,
    getProjectInfo: getProjectInfo,
    setProject: setProject,
    deleteProject: deleteProject,
    newProject: newProject,
    editProject: editProject
  };
}

export const projectsData = projectsFunc();
