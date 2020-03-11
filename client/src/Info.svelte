<script>
  import { login } from "./stores/login.js";
</script>

<style>
  .card {
    max-width: 500px;
    margin: 10rem auto;
  }

  button {
    margin-top: 2rem;
  }

  .row {
    margin-bottom: 0;
  }
</style>

<div class="card">
  <div class="card-content">
    <div class="row">
      <p class="col s12">
        This is an app I made to help track bugs accross your projects. Each bug
        you log has a variety of information to help you keep track of what
        needs to be fixed in your projects. This app was built with Node and Koa
        for the API, as well as Svelte and MaterializeCSS for the front-end. You
        can find the documentation for the API here:
      </p>
      <button
        onclick="window.location.href = './docs/index.html';"
        class="blue-grey btn col s10 offset-s1 btn-large waves-effect">
        Documentation
      </button>
      <p class="col s12" style="margin-top: 1rem;">
        The front-end looks great on desktop as well as any mobile device. An
        interesting feature that I added is that if you put another users email
        as the "fixer" for a bug, that user will see that project and that bug
        when they login. This way people can work together on projects and track
        the bugs that need to be fixed between a team of people.
      </p>
      <p class="col s12">
        You can make a new account and start making new projects and they will
        be saved indefinitely, or try out all the features in a demo account by
        clicking the button bellow:
        <br />
        <small>
          In order to make a new bug you would normaly add your own email or the
          email of another user as the "fixer". The email for the demo account
          is Demo@gmail.com
        </small>
      </p>
      <button
        on:click={() => login.login({
            email: 'Demo@gmail.com',
            password: '123456'
          })}
        class="blue-grey btn col s10 offset-s1 btn-large waves-effect">
        Demo
      </button>
    </div>
  </div>
</div>
