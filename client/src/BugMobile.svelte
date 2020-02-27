<script>
  import { onMount } from "svelte";
  import { bugs } from "./stores/bugs.js";
  import { slide } from "svelte/transition";

  export let bug;
  export let i;
  export let show;

  let editBody = {};

  const editBug = async e => {
    const progress = document.getElementById(`progress-${i}`);
    progress.classList.remove("hide");

    for (let key in editBody) {
      if (editBody[key] === "") delete editBody[key];
    }

    const res = await bugs.editBug(editBody, bug._id, i);

    if (res === true) {
      show = null;
    } else if (res.error === "Cannot read property '_id' of null") {
      M.toast({
        html: "'fixer' must be a users email",
        classes: "red darken-2"
      });
    }
    progress.classList.add("hide");
  };

  const deleteBug = async () => {
    const conf = confirm("Are you sure you want to delete this bug?");

    if (!conf) return;

    const progress = document.getElementById(`progress-${i}`);
    progress.classList.remove("hide");

    const res = await bugs.deleteBug(bug._id, i);

    if (res === true) {
      show = null;
    } else {
      M.toast({
        html: res.error,
        classes: "red darken-2"
      });
    }

    progress.classList.add("hide");
  };
</script>

<style>
  i {
    font-size: 35px;
    margin: auto 0;
    transition: color 250ms ease-in-out;
  }

  #more:hover {
    color: rgb(175, 175, 175);
  }
</style>

<li>
  <div
    class="row valign-wrapper"
    style="padding: 1rem 0; border-bottom: 1px solid #ddd; margin: 0;
    background: white;">
    <div class="col s3 center">{bug.name}</div>
    <div class="col s3 center">{bug.fixer.name}</div>
    {#if bug.status === 'Open'}
      <div class="col s3 center">
        <div class="red" style="color: white; border-radius: 5px">
          {bug.status}
        </div>
      </div>
    {:else if bug.status === 'In Progress'}
      <div class="col s3 center">
        <div class="blue" style="color: white; border-radius: 5px">
          {bug.status}
        </div>
      </div>
    {:else if bug.status === 'To Be Tested'}
      <div class="col s3 center">
        <div class="orange" style="color: white; border-radius: 5px">
          {bug.status}
        </div>
      </div>
    {:else if bug.status === 'Closed'}
      <div class="col s3 center">
        <div class="green" style="color: white; border-radius: 5px">
          {bug.status}
        </div>
      </div>
    {/if}
    <div class="col s3 center">
      <i
        id="more"
        on:click={() => (show === i ? (show = null) : (show = i))}
        class="material-icons collapsible-header"
        style="padding: 0; border-bottom: none; justify-content: center;
        background: transparent;">
        more_vert
      </i>
    </div>
  </div>

  {#if show === i}
    <div class="blue-grey lighten-5" transition:slide>
      <div class="row" style="margin: 0;">
        <div class="col s12 l6">
          <div class="card">
            <div class="card-content">
              <span class="card-title">Update</span>
              <div class="input-field" style="height: 5rem;">
                <input bind:value={editBody.name} type="text" />
                <label>name</label>
              </div>
              <div class="input-field">
                <input bind:value={editBody.fixer} type="text" />
                <label>fixer</label>
                <span class="helper-text">must be a users email</span>
              </div>
              <div class="row">
                <div class="col s6">
                  <select bind:value={editBody.status}>
                    <option value="" disabled selected>status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="To Be Tested">To Be Tested</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div class="col s5 offset-s1">
                  <select bind:value={editBody.severity}>
                    <option value="" disabled selected>severity</option>
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                  </select>
                </div>
                <div class="col s12">
                  <select bind:value={editBody.reproduceability}>
                    <option value="" disabled selected>reproduceability</option>
                    <option value="Always">Always</option>
                    <option value="Intermitent">Intermitent</option>
                  </select>
                </div>
                <div class="input-field col s12">
                  <textarea
                    class="materialize-textarea"
                    bind:value={editBody.description} />
                  <label>description</label>
                </div>
                <button
                  class="col s12 btn blue"
                  on:click|preventDefault={editBug}>
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="col s12 l6">
          <div class="card">
            <div class="card-content">
              <div class="row">
                <div class="col s12">
                  <h6>Description:</h6>
                  <p>{bug.description}</p>
                </div>
                <div class="col s6">
                  <h6>Reporter:</h6>
                  <p>{bug.reporter.name}</p>
                </div>
                <div class="col s6">
                  <h6>Fixer:</h6>
                  <p>{bug.fixer.name}</p>
                </div>
                {#if bug.severity === 'Minor'}
                  <div class="col s6">
                    <h6>Severity:</h6>
                    <div
                      class="purple center"
                      style="color: white; border-radius: 5px">
                      {bug.severity}
                    </div>
                  </div>
                {:else if bug.severity === 'Major'}
                  <div class="col s6">
                    <h6>Severity:</h6>
                    <div
                      class="purple darken-3 center"
                      style="color: white; border-radius: 5px">
                      {bug.severity}
                    </div>
                  </div>
                {/if}
                {#if bug.reproduceability === 'Always'}
                  <div class="col s6">
                    <h6>Reproduceability</h6>
                    <div
                      class="cyan darken-3 center"
                      style="color: white; border-radius: 5px">
                      {bug.reproduceability}
                    </div>
                  </div>
                {:else if bug.reproduceability === 'Intermitent'}
                  <div class="col s6">
                    <h6>Reproduceability:</h6>
                    <div
                      class="cyan center"
                      style="color: white; border-radius: 5px">
                      {bug.reproduceability}
                    </div>
                  </div>
                {/if}
                <div class="col s12">
                  <h6>Created At:</h6>
                  <p>
                    {new Date(Date.parse(bug.createdAt)).toLocaleString(
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
                </div>
                <div class="col s12">
                  <h6>Last Updated:</h6>
                  <p>
                    {new Date(Date.parse(bug.updatedAt)).toLocaleString(
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
                </div>
              </div>
            </div>
            <div class="card-action">
              <button class="btn red" on:click|preventDefault={deleteBug}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      <div style="height: 0.5rem;">
        <div id="progress-{i}" class="progress hide" style="margin: 0;">
          <div class="indeterminate" />
        </div>
      </div>
    </div>
  {/if}
</li>
