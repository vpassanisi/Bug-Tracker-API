<script>
  import { projectsData } from "./stores/projectsData";
  import { push } from "svelte-spa-router";
  import { onMount, afterUpdate } from "svelte";

  export let index;
  export let project;
  let editedProject = project;

  const setProject = async () => {
    const res = await projectsData.setProject(project._id);

    if (res.success) {
      push("/bugs");
    } else {
      M.toast({ html: `${res.error}`, classes: "red" });
    }
  };

  const deleteProject = async () => {
    const conf = confirm(
      "Are you sure you want to delete this project? All of the bugs in this project will be permanently deleted"
    );

    if (!conf) return;

    await projectsData.deleteProject(project._id, index);
  };

  afterUpdate(() => {
    editedProject = project;
  });

  onMount(() => {
    const modalElems = document.querySelectorAll(".modal");
    const modalInstances = M.Modal.init(modalElems);
  });
</script>

<style>
  i {
    margin-left: 0;
  }
</style>

<div class="col s12 m6 l4 xl3">
  <div class="card hoverable small card">
    <div class="card-content">
      <span class="card-title center">{project.name}</span>
      <div class="blue-grey lighten-4" style="padding: .5rem">
        Bugs: {project.bugsCount}
      </div>
      <p style="padding-top: 0.5rem">{project.description}</p>
      <div class="card-action grey lighten-5">
        <a
          href={null}
          on:click|preventDefault={setProject}
          class="cyan-text text-darken-4"
          style="margin-right:0; cursor: pointer;">
          Go To Project
        </a>
        <a href={null}>
          <i
            class="material-icons right activator cyan-text text-darken-4"
            style="cursor: pointer;">
            more_vert
          </i>
        </a>
      </div>
    </div>
    <div class="card-reveal">
      <span class="card-title grey-text text-darken-4">
        {project.name}
        <i class="material-icons right">close</i>
      </span>
      <p>
        Created: {new Date(Date.parse(project.createdAt)).toLocaleString(
          'en-US',
          {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }
        )}
      </p>
      <p>
        Last Updated: {new Date(Date.parse(project.updatedAt)).toLocaleString(
          'en-US',
          {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }
        )}
      </p>
      <div class="card-action">
        <button class="btn red" on:click|preventDefault={deleteProject}>
          delete
        </button>
        <button
          class="btn blue right modal-trigger"
          href={`#editProjectModal-${index}`}>
          edit
        </button>
      </div>
    </div>
  </div>
</div>

<div
  id={`editProjectModal-${index}`}
  class="modal grey lighten-4"
  style="max-width: 640px;">
  <div class="modal-content">
    <h4 class="cyan-text text-darken-4 center" style="font-weight: 300;">
      Edit Project
    </h4>
    <div class="row">
      <div class="input-field col s10 offset-s1">
        <input type="text" placeholder="name" bind:value={editedProject.name} />
      </div>
      <div class="input-field col s10 offset-s1">
        <textarea
          class="materialize-textarea"
          bind:value={editedProject.description}
          placeholder="description" />
      </div>
      <div>
        <button
          on:click|preventDefault={projectsData.editProject(project, index)}
          class="modal-close waves-effect waves-green btn btn-large blue-grey
          col s8 offset-s2">
          Submit
        </button>
      </div>
    </div>
  </div>
</div>
