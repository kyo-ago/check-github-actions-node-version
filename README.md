# check-github-actions-node-version

Check the old node-version used by external github-actions.

inspired by [pkgdeps/update\-github\-actions\-permissions: A CLI that update GitHub Actions's \`permissions\` automatically](https://github.com/pkgdeps/update-github-actions-permissions)

## Install

Install with [npm](https://www.npmjs.com/):

    npm install check-github-actions-node-version --global

or Install and Run via `npx` command:

    npx check-github-actions-node-version ".github/workflows/*.{yaml,yml}"

## Usage

  Check your github actions are using an older version of node.

  Usage
    $ check-github-actions-node-version [ file ... ]

  Options
      --target  [String] "node12" or "node16". Default: "node12"
      --verbose [Boolean] If enable verbose, output debug info.

  Examples
    $ update-github-actions-permissions .github/**/*.yml

**References**

- [GitHub Actions: All Actions will begin running on Node16 instead of Node12 \| GitHub Changelog](https://github.blog/changelog/2022-09-22-github-actions-all-actions-will-begin-running-on-node16-instead-of-node12/)

## Detection logics

- Read your workflow file
- Collect `uses` actions
- Fetch actions.yml from `https://raw.githubusercontent.com/${name}/${version}/action.yml`
- Compare `runs.using` with --target
- Output if it matches

## Changelog

See [Releases page](../../releases).

## Running tests

Install devDependencies and Run `npm test`:

    npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature
requests, [please create an issue](../../issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- kyo-ago: [GitHub](https://github.com/kyo-ago), [Twitter](https://twitter.com/kyo_ago)

## License

[MIT license](./LICENSE)
