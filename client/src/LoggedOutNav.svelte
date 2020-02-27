<script>
  import { onMount } from "svelte";
  import { push, location, link } from "svelte-spa-router";

  let sideNavInstance;

  const createUserPage = () => {
    sideNavInstance[0].close();
    push("/createUser");
  };

  const loginPage = () => {
    sideNavInstance[0].close();
    push("/login");
  };

  onMount(function() {
    let elems = document.querySelectorAll(".sidenav");
    sideNavInstance = M.Sidenav.init(elems);
  });
</script>

<style>
  hr {
    margin: 0;
  }
</style>

<ul class="right hide-on-med-and-down">
  <li>
    <a href={null} on:click|preventDefault={loginPage}>login</a>
  </li>
  <li>
    <a href={null} on:click|preventDefault={createUserPage}>join</a>
  </li>
  <li>
    <a href="/info" use:link>info</a>
  </li>
</ul>

<ul class="sidenav collapsible" id="mobile-demo">
  <div class="center">
    <i class="material-icons black-text">bug_report</i>
  </div>
  <hr />
  <li>
    <a on:click|preventDefault={loginPage} href={null}>login</a>
  </li>
  <hr />
  <li>
    <a on:click={createUserPage} href={null}>join</a>
  </li>
  <hr />
  <li>
    <a href="#!">info</a>
  </li>
  <hr />
</ul>
