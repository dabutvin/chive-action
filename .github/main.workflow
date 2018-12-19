workflow "Chive" {
  on = "push"
  resolves = ["NPM package-lock.json"]
}

action "NPM package-lock.json" {
  uses = "./"
  args = "path"
}
