import type { FetchOptions } from "ofetch";
import { storage } from "./storage";

let githubToken: string | undefined;
function getGithubToken() {
  if (githubToken) return githubToken;
  if (process.env.GH_TOKEN)
    githubToken = process.env.GH_TOKEN;
  return githubToken;
}

export function createClient(token: string) {
  githubToken = token;
}

export function validateGhResponse(res: any) {
  if (!res || isEmptyArray(res.value) || res.value?.total_count === 0 || isEmptyArray(res.value?.items))
    return false;
  return true;
}

export async function ghFetch<T = any>(url: string, opts: FetchOptions = {}) {
  if (await storage.hasItem(url))
    return await storage.getItem<T>(url);
  const res = $fetch<T>(url, {
    baseURL: "https://api.github.com",
    ...opts,
    method: (opts.method || "GET").toUpperCase() as any,
    headers: {
      "User-Agent": "fetch",
      Authorization: "token " + getGithubToken(),
      ...opts.headers,
    },
  });
  if (validateGhResponse(res))
    return res;
  await storage.setItem(url, res);
  return res;
}

function isEmptyArray(val: any) {
  return Array.isArray(val) && val.length === 0;
}

export const ghRepo = cachedFunction((repo: string) => {
  return ghFetch(`/repos/${repo}`);
}, cacheOptions("repo"));

export const ghRepoContributors = cachedFunction((repo: string) => {
  return ghFetch(`/repos/${repo}/contributors`);
}, cacheOptions("contributors"));

export const ghRepoFiles = cachedFunction((repo: string, ref: string) => {
  return ghFetch(`/repos/${repo}/git/trees/${ref}?recursive=1`);
}, cacheOptions("files"));

export const ghMarkdown = cachedFunction(
  (markdown: string, repo: string, _id: string) => {
    if (!markdown) {
      return "";
    }
    return ghFetch("/markdown", {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        "content-type": "text/x-markdown",
      },
      body: JSON.stringify({
        text: markdown,
        context: repo,
      }),
    });
  },
  {
    ...cacheOptions("markdown"),
    getKey: (_markdown, repo, id) => repo + "/" + id,
  },
);
