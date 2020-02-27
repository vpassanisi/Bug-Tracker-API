<script>
  import Navbar from "./Navbar.svelte";
  import CreateUser from "./CreateUser.svelte";
  import Login from "./Login.svelte";
  import Projects from "./Projects.svelte";
  import BugsWorkspace from "./BugsWrokspace.svelte";
  import Info from "./Info.svelte";
  import Router from "svelte-spa-router";
  import { push } from "svelte-spa-router";
  import { login } from "./stores/login";
  import { onMount } from "svelte";

  const routes = {
    "/": Login,
    "/createUser": CreateUser,
    "/projects": Projects,
    "/bugs": BugsWorkspace,
    "/info": Info,
    "*": Login
  };

  onMount(async () => login.getMe());
</script>

<main>
  <Navbar />
  <Router {routes} />
</main>
