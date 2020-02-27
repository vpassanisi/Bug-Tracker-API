<script>
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import { login } from "./stores/login.js";
  import { projectsData } from "./stores/projectsData.js";
  import ProjectCards from "./ProjectCards.svelte";

  onMount(() => projectsData.getProjects());
</script>

<div style="margin: 0 auto; max-width: 1280px;">
  <div class="center">
    <h3 class="cyan-text text-darken-4" style="font-weight: 300;">
      Your Projects
    </h3>
  </div>
  <div class="row">
    <div class="col s10 offset-s1">
      <div id="projects-panel" class="card-panel grey lighten-1 row">
        {#each $projectsData as project, i}
          <ProjectCards index={i} {project} />
        {/each}
      </div>
    </div>
  </div>
</div>
