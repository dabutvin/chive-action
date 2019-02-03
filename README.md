# NOTICE file generator (chive-action)

Create a NOTICE attribution file based on your package-lock.json as a github action!

- uses https://www.npmjs.com/package/tiny-attribution-generator (chive) and https://clearlydefined.io
- optional custom NOTICE_TEMPLATE
- optional argument for filename to use (--filename)
- optional argument for including devDependencies (--includeDev) (excluded by default)

add ./github/main.workflow to your repo

```
workflow "NOTICE file generator" {
  on = "push"
  resolves = ["NOTICE file generator"]
}

action "NOTICE file generator" {
  uses = "dabutvin/chive-action@master"
  secrets = ["GITHUB_TOKEN"]
}
```

with custom file name argument

```
action "NOTICE file generator" {
  uses = "dabutvin/chive-action@master"
  secrets = ["GITHUB_TOKEN"]
  args = "--filename=MyNotices.md"
}
```

include devDependencies in notices

```
action "NOTICE file generator" {
  uses = "dabutvin/chive-action@master"
  secrets = ["GITHUB_TOKEN"]
  args = "--includeDev=true"
}
```
