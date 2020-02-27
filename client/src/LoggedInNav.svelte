<script>
  import { onMount, afterUpdate } from "svelte";
  import { push, location } from "svelte-spa-router";
  import { login } from "./stores/login";
  import { bugs } from "./stores/bugs.js";
  import { projectsData } from "./stores/projectsData.js";

  let sideNavInstance;
  let modalInstances;

  let newBugBody = {};
  let newProjectBody = {};

  onMount(() => {
    const modalElems = document.querySelectorAll(".modal");
    modalInstances = M.Modal.init(modalElems);
    const collapsibleElems = document.querySelectorAll(".collapsible");
    const collapsibleInstances = M.Collapsible.init(collapsibleElems);
    const sideNavElems = document.querySelectorAll(".sidenav");
    sideNavInstance = M.Sidenav.init(sideNavElems);
    const dropdownElems = document.querySelectorAll(".dropdown-trigger");
    const dropdownInstances = M.Dropdown.init(dropdownElems, {
      alignment: "right",
      constrainWidth: false,
      coverTrigger: false,
      hover: true
    });
    const selectElems = document.querySelectorAll("select");
    const selectInstances = M.FormSelect.init(selectElems);
  });

  const newBug = async () => {
    for (let key in newBugBody) {
      if (newBugBody[key] === "") delete newBugBody[key];
    }
    const res = await bugs.newBug(newBugBody);
  };

  const newProject = async () => {
    const res = await projectsData.newProject(newProjectBody);

    if (res.success) {
      push("/bugs");
    }
  };

  afterUpdate(() => {
    if ($bugs !== null && $bugs.length === 0) {
      modalInstances[0].open();
    }
  });

  const projects = () => {
    push("/projects");
    bugs.clearBugs();
    sideNavInstance[0].close();
  };
</script>

<style>
  .input-field input[type="text"] {
    border-bottom: 1px solid grey;
  }

  hr {
    margin: 0;
  }
</style>

<ul class="right hide-on-med-and-down">
  <li>
    <a on:click={() => login.logout()} href={null}>Logout</a>
  </li>
  {#if $location === '/bugs'}
    <li>
      <a on:click={projects} href={null}>Projects</a>
    </li>
  {/if}
  <li>
    <a
      style="width: 5rem;"
      class="dropdown-trigger center"
      data-target="dropdown1"
      href={null}>
      Add
    </a>
  </li>
</ul>

<ul id="dropdown1" class="dropdown-content">
  {#if $location === '/bugs'}
    <li>
      <a class="blue-text modal-trigger" href="#newBugModal">
        <i
          class="material-icons blue-text text-darken-4"
          style="margin-right: 0.5rem;">
          bug_report
        </i>
        New Bug
      </a>
    </li>
  {/if}
  <li>
    <a class="blue-text modal-trigger" href="#newProjectModal">
      <i
        class="material-icons blue-text text-darken-4"
        style="margin-right: 0.5rem;">
        view_list
      </i>
      New Project
    </a>
  </li>
</ul>

<ul class="sidenav collapsible" id="mobile-demo">
  <div class="center">
    <i class="material-icons black-text">bug_report</i>
  </div>
  <hr />
  <li>
    <a
      on:click|preventDefault={() => {
        login.logout();
        sideNavInstance[0].close();
      }}
      href={null}>
      logout
    </a>
  </li>
  <hr />
  {#if $location === '/bugs'}
    <li>
      <a on:click={projects} href={null}>Projects</a>
    </li>
    <hr />
  {/if}
  <li>
    <div style="padding: 0 32px;" class="collapsible-header black-text">
      Add
    </div>
    <hr />
    <div class="collapsible-body black-text grey lighten-2">
      {#if $location === '/bugs'}
        <a
          class="blue-text modal-trigger sidenav-close"
          style="padding-left: 64px"
          href="#newBugModal">
          New Bug
        </a>
        <hr />
      {/if}
      <a
        class="blue-text modal-trigger sidenav-close"
        style="padding-left: 64px"
        href="#newProjectModal">
        New Project
      </a>
    </div>
  </li>
</ul>

<div id="newBugModal" class="modal grey lighten-4" style="max-width: 640px">
  <div class="modal-content black-text">
    <h4 class="center cyan-text text-darken-4" style="font-weight: 300;">
      New Bug
    </h4>
    <div class="row">
      <div class="input-field col s10 offset-s1">
        <input type="text" bind:value={newBugBody.name} placeholder="name" />
      </div>
      <div class="input-field col s10 offset-s1">
        <input
          bind:value={newBugBody.fixer}
          type="text"
          placeholder="fixer (must be a users email)" />
      </div>
      <div class="input-field col s10 offset-s1">
        <textarea
          bind:value={newBugBody.description}
          class="materialize-textarea"
          placeholder="description" />
      </div>
      <div class="input-field col s4 offset-s1">
        <select bind:value={newBugBody.severity}>
          <option value="" disabled selected>severity</option>
          <option value="Major">Major</option>
          <option value="Minor">Minor</option>
        </select>
      </div>
      <div class="input-field col s5 m4 offset-s1 offset-m2">
        <select bind:value={newBugBody.reproduceability}>
          <option value="" disabled selected>reproduceability</option>
          <option value="Always">Always</option>
          <option value="Intermitent">Intermitent</option>
        </select>
      </div>
      <button
        on:click|preventDefault={newBug}
        class="col s8 offset-s2 modal-close waves-effect waves-green btn
        btn-large blue-grey"
        style="margin-top: 2rem">
        Submit
      </button>
    </div>
  </div>
</div>

<div
  id="newProjectModal"
  class="modal grey lighten-4"
  style="max-width: 640px;">
  <div class="modal-content">
    <h4 class="cyan-text text-darken-4 center" style="font-weight: 300;">
      New Project
    </h4>
    <div class="row">
      <div class="input-field col s10 offset-s1">
        <input
          type="text"
          bind:value={newProjectBody.name}
          placeholder="name" />
      </div>
      <div class="input-field col s10 offset-s1">
        <textarea
          bind:value={newProjectBody.description}
          class="materialize-textarea"
          placeholder="description" />
      </div>
      <div>
        <button
          on:click|preventDefault={newProject}
          class="modal-close waves-effect waves-green btn btn-large blue-grey
          col s8 offset-s2">
          Submit
        </button>
      </div>
    </div>
  </div>
</div>
