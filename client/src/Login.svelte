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

<h3 class="center cyan-text text-darken-4" style="font-weight: 300;">Login</h3>
<div style="margin: 0 auto; max-width: 600px;">
  <div class="card" style="margin: 0 1rem;">
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
          on:click|preventDefault={login.login(body)}>
          Login
        </button>
      </div>
    </div>
  </div>
</div>
