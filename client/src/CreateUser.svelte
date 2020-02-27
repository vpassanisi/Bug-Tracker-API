<script>
  import { login } from "./stores/login";

  let userBody = {};
</script>

<h3 class="center cyan-text text-darken-4" style="font-weight: 300;">
  New User
</h3>
<div style="margin: 0 auto; max-width: 600px;">
  <div class="card" style="margin: 0 1rem;">
    <div class="card-content">
      <div class="row">
        <div class="input-field col s10 offset-s1">
          <input id="name" type="text" bind:value={userBody.name} />
          <label for="name">Name</label>
        </div>
        <div class="input-field col s10 offset-s1">
          <input
            id="email"
            class="validate"
            type="email"
            bind:value={userBody.email} />
          <label for="email">Email</label>
        </div>
        <div class="input-field col s10 offset-s1">
          <input id="password" type="text" bind:value={userBody.password} />
          <label for="password">Password</label>
        </div>
      </div>
      <div class="row">
        <button
          on:click|preventDefault={login.createUser(userBody)}
          class="blue-grey btn col s10 offset-s1 btn-large waves-effect">
          Create
        </button>
      </div>
    </div>
  </div>
</div>
