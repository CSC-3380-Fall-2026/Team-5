const app = document.getElementById("app");

if (app) {
  app.innerHTML = `
    <div class="login-container">
      <h1>Time Capsule</h1>
      <p class="subtitle">Preserve your memories for the future.</p>

      <h2>Login</h2>

      <form>
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          placeholder="Enter your email"
        >

        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          placeholder="Enter your password"
        >

        <button type="button">Log In</button>
      </form>

      <p class="signup-text">
        Don't have an account?
        <span>Sign Up</span>
      </p>
    </div>
  `;
}

export {};