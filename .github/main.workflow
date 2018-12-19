workflow "Helllo" {
  on = "push"
  resolves = ["Hello World", "NPM package-lock.json"]
}

action "Hello World" {
  uses = "./action-a"
  args = "Actions!"
}

action "NPM package-lock.json" {
  uses = "./npm"
  args = "path"
}
