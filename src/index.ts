import yaml from "yaml";
import * as fs from "node:fs/promises";
import fetch from "node-fetch";
import { Options } from "./cli.js";

type GitHubActionStepSchema = {
  uses?: string;
}[];
type GitHubActionSchema = {
  jobs?: {
    [jobName: string]: {
      steps: GitHubActionStepSchema;
    };
  };
  runs?: {
    steps: GitHubActionStepSchema;
  };
};
type GitHubMarketplaceActionSchema = {
  runs?: {
    using?: string;
  };
};

type CheckResult = {
  actionName: string;
  actionVersion: string;
  nodeVersion: string;
};

type GitHubFileActionUses = {
  usesActions: [name: string, version: string][];
  filePath: string;
};

type GitHubActionUses = [name: string, version: string];
const collectUsesActions = (action: GitHubActionSchema): GitHubActionUses[] => {
  const collectUses = (steps: GitHubActionStepSchema) => {
    return steps
      .filter((step) => step.uses)
      .map((step) => {
        const [name, version] = step.uses!.split("@");
        return [name, version];
      });
  };
  const jobsUses = Object.values(action.jobs ?? {}).flatMap((job) => {
    if (!job.steps) {
      return [];
    }
    return collectUses(job.steps);
  });
  const runsUses = collectUses(action.runs?.steps ?? []);
  return [...jobsUses, ...runsUses] as GitHubActionUses[];
};

const collectFileActions = async (
  filePath: string,
  options: Options
): Promise<GitHubFileActionUses> => {
  const yamlContent = await fs.readFile(filePath, "utf-8");
  const content = yaml.parse(yamlContent) satisfies GitHubActionSchema;
  const usesActions = collectUsesActions(content);
  if (options.verbose) {
    console.info(`collect file: ${filePath}`);
    console.info(
      `     actions: ${usesActions
        .map(([name, version]) => `${name}@${version}`)
        .join(", ")}`
    );
  }
  return {
    usesActions,
    filePath,
  };
};

const convertUsesActions = (
  fileActionUses: GitHubFileActionUses[]
): GitHubActionUses[] => {
  const uses = fileActionUses.flatMap(({ usesActions }) => usesActions);
  return uses.filter(([name, version]) =>
    uses.some(
      ([someName, someVersion]) => someName === name && version === someVersion
    )
  );
};

const fetchNodeVersion = async (
  [name, version]: GitHubActionUses,
  options: Options
): Promise<CheckResult> => {
  const url = new URL(
    `https://raw.githubusercontent.com/${name}/${version}/action.yml`
  );
  const result = await fetch(url.href).then((res) => res.text());
  const content = yaml.parse(result) satisfies GitHubMarketplaceActionSchema;
  const nodeVersion = String(content.runs?.using ?? "");
  if (options.verbose) {
    console.info(`fetch: ${url.href}`);
    console.info(` node: ${nodeVersion}`);
  }
  return {
    actionName: name,
    actionVersion: version,
    nodeVersion,
  };
};

const filterNodeVersion = (
  fileUses: GitHubFileActionUses[],
  allUses: CheckResult[],
  options: Options
) => {
  return fileUses.map(({ usesActions, filePath }) => {
    const filteredUsesActions = usesActions
      .map(([name, version]) => {
        const nodeVersion = allUses.find(
          ({ actionName, actionVersion }) =>
            actionName === name && actionVersion === version
        )?.nodeVersion;
        return {
          name,
          version,
          nodeVersion: nodeVersion ?? "",
        };
      })
      .filter(({ nodeVersion }) => nodeVersion === options.target);
    return {
      usesActions: filteredUsesActions,
      filePath,
    };
  });
};

export const checkGitHubActions = async (
  expendedFilePaths: string[],
  options: Options
) => {
  const fileUsesResultPromises = expendedFilePaths.map((file) =>
    collectFileActions(file, options)
  );
  const usesResults = await Promise.all(fileUsesResultPromises);
  const versionsResultPromises = convertUsesActions(usesResults).map((uses) =>
    fetchNodeVersion(uses, options)
  );
  const versionsResults = await Promise.all(versionsResultPromises);
  return filterNodeVersion(usesResults, versionsResults, options);
};
