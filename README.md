# ClearlyNoticed Action - OSS atrribution file generator

Maintain a NOTICE file based on your package-lock.json using GitHub Actions!

![](https://clearlydefined.io/static/media/logo-text-stacked.d14f6270.svg)

Uses https://www.npmjs.com/package/tiny-attribution-generator (chive) for rendering and https://clearlydefined.io for data

### Options

- custom NOTICE_TEMPLATE you check in to the root or .github folder
- argument for filename to use (--filename). Defaults to NOTICE
- argument for including devDependencies (--includeDev). Defaults to excluded

### How it works

1. Include this Action in your workflow
2. When the Action runs, a pull request will be created with your new NOTICE file
3. Merge the pull request and delete the branch
4. As your dependencies evolve, new pull requests get opened with the changes

add ./github/main.workflow to your repo

```
workflow "My Workflow" {
  on = "push"
  resolves = ["ClearlyNoticed"]
}

action "ClearlyNoticed" {
  uses = "dabutvin/chive-action@master"
  secrets = ["GITHUB_TOKEN"]
}
```

with custom file name argument

```
action "ClearlyNoticed" {
  uses = "dabutvin/chive-action@master"
  secrets = ["GITHUB_TOKEN"]
  args = "--filename=MyNotices.md"
}
```

include devDependencies in notices

```
action "ClearlyNoticed" {
  uses = "dabutvin/chive-action@master"
  secrets = ["GITHUB_TOKEN"]
  args = "--includeDev=true"
}
```

This is an example of a custom template you could use. It uses a handlebars template.

```
SOFTWARE NOTICES AND INFORMATION
Do Not Translate or Localize

This software incorporates material from third parties.
Notwithstanding any other terms, you may reverse engineer this software to the extent
required to debug changes to any libraries licensed under the GNU Lesser General Public License.

{{#buckets}}
{{#packages}}

-------------------------------------------------------------------

{{{name}}} {{{version}}} - {{{../name}}}
{{#if website}}
{{{website}}}
{{/if}}
{{#if copyrights}}
{{#copyrights}}
{{{this}}}
{{/copyrights}}
{{/if}}

{{{../text}}}

-------------------------------------------------------------------
{{/packages}}
{{/buckets}}
```
