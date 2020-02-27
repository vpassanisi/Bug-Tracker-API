<script>
  import { onMount, afterUpdate } from "svelte";
  import { bugs } from "./stores/bugs.js";
  import { projectsData } from "./stores/projectsData.js";
  import MediaQuery from "svelte-media-query";
  import BugMobile from "./BugMobile.svelte";
  import Bug from "./Bug.svelte";

  let projectInfo = false;
  let show = null;

  const sortBugs = e => {
    const element = e.target.innerText.toLowerCase();

    bugs.sortBugs(element);
  };

  onMount(async () => {
    const res = await projectsData.getProjectInfo();

    if (res.success) {
      projectInfo = res.data;
    } else {
      console.log(res);
    }
  });
  onMount(async () => {
    const loadingBar = document.getElementById("loadingBar");
    loadingBar.classList.remove("hide");

    await bugs.loadBugs();

    loadingBar.classList.add("hide");
  });

  afterUpdate(function() {
    const elems = document.querySelectorAll("select");
    const instances = M.FormSelect.init(elems);
  });
</script>

<div class="custom-container" style="margin: 0 auto; max-width: 1280px;">
  {#if projectInfo.name}
    <h3
      class="center cyan-text text-darken-4"
      style="font-weight: 300; margin: 1rem 0">
      {projectInfo.name}
    </h3>
  {/if}

  <ul class="collapsible">
    <li>
      <MediaQuery query="(min-width: 993px)" let:matches>
        {#if matches}
          <div
            class="row blue-grey darken-4 valign-wrapper"
            style="padding: 1rem; margin: 0;">
            <div class="col s2 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text"
                href={null}
                on:click|preventDefault={sortBugs}>
                name
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
            <div class="col s2 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text"
                href={null}
                on:click|preventDefault={sortBugs}>
                reporter
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
            <div class="col s2 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text"
                href={null}
                on:click|preventDefault={sortBugs}>
                fixer
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
            <div class="col s2 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text"
                href={null}
                on:click|preventDefault={sortBugs}>
                status
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
            <div class="col s1 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text"
                href={null}
                on:click|preventDefault={sortBugs}>
                severity
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
            <div class="col s2 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text"
                href={null}
                on:click|preventDefault={sortBugs}>
                reproduceability
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
            <div class="col s1 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text disabled"
                href={null}
                on:click|preventDefault={sortBugs}>
                more
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
          </div>
        {/if}
      </MediaQuery>
      <MediaQuery query="(max-width: 992px)" let:matches>
        {#if matches}
          <div
            class="row blue-grey darken-4 valign-wrapper"
            style="padding: 1rem 0; margin: 0;">
            <div class="col s3 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text"
                href={null}
                on:click|preventDefault={sortBugs}>
                name
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
            <div class="col s3 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text"
                href={null}
                on:click|preventDefault={sortBugs}>
                fixer
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
            <div class="col s3 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text"
                href={null}
                on:click|preventDefault={sortBugs}>
                status
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
            <div class="col s3 center" style="padding: 0;">
              <a
                class="btn-flat blue-grey darken-3 white-text disabled"
                href={null}
                on:click|preventDefault={sortBugs}>
                more
                <i class="material-icons right hide" style="margin-left: 0">
                  keyboard_arrow_down
                </i>
              </a>
            </div>
          </div>
        {/if}
      </MediaQuery>
      <hr style="margin: 0;" />
    </li>
    <MediaQuery query="(min-width: 993px)" let:matches>
      {#if matches}
        {#if $bugs}
          {#each $bugs as bug, i}
            <Bug {i} {bug} bind:show />
          {/each}
        {/if}
      {/if}
    </MediaQuery>
    <MediaQuery query="(max-width: 992px)" let:matches>
      {#if matches}
        {#if $bugs}
          {#each $bugs as bug, i}
            <BugMobile {i} {bug} bind:show />
          {/each}
        {/if}
      {/if}
    </MediaQuery>

  </ul>
  <div id="loadingBar" class="progress hide">
    <div class="indeterminate" />
  </div>
</div>
