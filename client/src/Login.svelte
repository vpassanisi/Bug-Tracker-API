<script>
  import { login } from "./stores/login";
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";

  const body = {
    email: "",
    password: ""
  };
</script>

<style>
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    transition: background-color 5000s ease-in-out 0s;
    -webkit-text-fill-color: black;
  }
</style>

<h3 class="center cyan-text text-darken-4 font-hairline">Login</h3>
<div class="mx-auto my-0 w-max-600">
  <div class="card my-0 mx-1">
    <form action="submit">
      <div class="card-content">
        <div class="row">
          <div class="input-field col s10 offset-s1">
            <input
              id="email"
              class="validate"
              type="email"
              bind:value={body.email} />
            <label for="email">Email</label>
          </div>
          <div class="input-field col s10 offset-s1">
            <input
              id="password"
              class="validate"
              type="text"
              bind:value={body.password} />
            <label for="password">Password</label>
          </div>
        </div>

        <div class="row">
          <button
            class="blue-grey btn col s10 offset-s1 btn-large waves-effect"
            type="submit"
            on:click|preventDefault={login.login(body)}>
            Login
          </button>
        </div>
      </div>
    </form>

  </div>
</div>
