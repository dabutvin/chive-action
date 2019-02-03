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
