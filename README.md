# chive-action

Create a NOTICE attribution file based on your package-lock.json as a github action!

- uses https://www.npmjs.com/package/tiny-attribution-generator and https://clearlydefined.io to generate
- optional custom NOTICE_TEMPLATE
- optional argument for filename to use (--filename)
- optional argument for including devDependencies (--includeDev) (excluded by default)

add ./github/main.workflow to your repo

```
workflow "NOTICE file generate" {
  on = "push"
  resolves = ["Chive Action"]
}

action "Chive Action" {
  uses = "dabutvin/chive-action@master"
  secrets = ["GITHUB_TOKEN"]
}
```

with custom file name

```
action "Chive Action" {
  uses = "dabutvin/chive-action@master"
  secrets = ["GITHUB_TOKEN"]
  args = "--filename=MyNotices.md"
}
```

include devDependencies in notices

```
action "Chive Action" {
  uses = "dabutvin/chive-action@master"
  secrets = ["GITHUB_TOKEN"]
  args = "--includeDev=true"
}
```
