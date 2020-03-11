<script>
  import { login } from "./stores/login";
  import LoggedInNav from "./LoggedInNav.svelte";
  import LoggedOutNav from "./LoggedOutNav.svelte";
  import { link } from "svelte-spa-router";
</script>

<nav>
  <div class="nav-wrapper cyan darken-4">
    <div class="container">
      <a href="/" use:link class="brand-logo left">Aquila</a>
      <a
        href={null}
        data-target="mobile-demo"
        class="sidenav-trigger right"
        style="cursor: pointer;">
        <i class="material-icons">menu</i>
      </a>
      {#if $login}
        <LoggedInNav />
      {:else}
        <LoggedOutNav />
      {/if}
    </div>
  </div>
</nav>
