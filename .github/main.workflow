workflow "NOTICE file generate" {
  on = "push"
  resolves = ["ClearlyNoticed"]
}

action "ClearlyNoticed" {
  uses = "./"
  secrets = ["GITHUB_TOKEN"]
}
