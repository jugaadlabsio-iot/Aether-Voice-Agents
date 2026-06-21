module.exports = {
  apps: [{
    name: "ringg_clone_backend",
    script: "./index.js",
    env_production: {
      NODE_ENV: "production",
      PORT: 3001
    }
  }]
}
