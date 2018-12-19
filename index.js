const fs = require('fs')
const path = require('path')
const DocBuilder = require('tiny-attribution-generator/lib/docbuilder').default
const TextRenderer = require('tiny-attribution-generator/lib/outputs/text').default;
const ClearlyDefinedSource = require('tiny-attribution-generator/lib/inputs/clearlydefined').default;
const JsonRenderer = require('tiny-attribution-generator/lib/outputs/json').default;
const PackageLockSource = require('tiny-attribution-generator/lib/inputs/packagelock').default;

const jsonRenderer = new JsonRenderer();
const jsonBuilder = new DocBuilder(jsonRenderer);
const clearlyDefinedBuilder = new DocBuilder(new TextRenderer());

const packageData = fs.readFileSync(
  path.join(__dirname, './package-lock.json')
);

const packageLockSource = new PackageLockSource(packageData.toString());
jsonBuilder
  .read(packageLockSource)
  .then(() => jsonBuilder.build())
  .then(jsonOutput => {
    const clearlydefinedInput = {
      coordinates: jsonOutput.packages.map(
        x =>
          x.name.indexOf('/') > -1
            ? `npm/npmjs/${x.name}/${x.version}`
            : `npm/npmjs/-/${x.name}/${x.version}`
      ),
    };
    return clearlyDefinedBuilder.read(
      new ClearlyDefinedSource(JSON.stringify(clearlydefinedInput))
    );
  })
  .then(() => {
    const output = clearlyDefinedBuilder.build();
    console.log(output);
  });
