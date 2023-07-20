import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Octokit } from "https://esm.sh/octokit?dts";

serve(async (req) => {
	const { path, newPath, commitMessage, content } = await req.json()
	const octokit = new Octokit({
		auth: Deno.env.get("GH_ACCESS_TOKEN")
	})

	const response = await octokit.request(`PUT /repos/hearts-of-iron-2/wiki/contents/${path}`, {
		owner: 'hearts-of-iron-2',
		repo: 'wiki',
		path: newPath,
		message: commitMessage,
		committer: {
			name: 'Ivan Dimitrov',
			email: 'ivan@idimitrov.dev'
		},
		content: content,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	return new Response(
		JSON.stringify(response),
		{ headers: { "Content-Type": "application/json" } },
	)
})

