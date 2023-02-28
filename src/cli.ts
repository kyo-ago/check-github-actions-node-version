import meow from "meow";
import * as globby from "globby";
import { checkGitHubActions } from "./index.js";

const cli = meow(
  `
    Usage
      $ check-github-actions-node-version [ file ... ]

    Options
        --target  [String] "node12" or "node16". Default: "node12"
        --verbose [Boolean] If enable verbose, output debug info.

    Examples
      $ update-github-actions-permissions .github/**/*.yml
`,
  {
    importMeta: import.meta,
    flags: {
      target: {
        type: "string",
        default: "node12",
      },
      verbose: {
        type: "boolean",
        default: false,
      },
    },
    autoHelp: true,
    autoVersion: true,
  }
);

export type Options = typeof cli.flags;

export const run = async (
  input = cli.input,
  flags = cli.flags
): Promise<{
  exitStatus: number;
  stdout: string | null;
  stderr: Error | null;
}> => {
  if (flags.verbose) {
    console.info("target node version: " + flags.target);
  }
  const expendedFilePaths = await globby.globby(input);
  const results = await checkGitHubActions(expendedFilePaths, flags);
  const stdout = results
    .map(({ filePath, usesActions }) => {
      usesActions
        .map(({ name, version, nodeVersion }) => {
          console.log(
            `${filePath}: ${name}@${version} uses node@${nodeVersion}`
          );
        })
        .join("\n");
    })
    .join("\n");
  return {
    stdout: stdout,
    stderr: null,
    exitStatus: 0,
  };
};
