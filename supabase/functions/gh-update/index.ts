import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Octokit } from "https://esm.sh/octokit?dts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};
const octokit = new Octokit({
	auth: Deno.env.get("GH_ACCESS_TOKEN"),
});
serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	if (!await isAuthorized(req)) {
		return new Response("Not authorized", {
			status: 401,
			headers: { ...corsHeaders },
		});
	}


	let json = await req.json();

	const file = await getFile(json.path);
	json = {
		...json,
		sha: file.data.sha,
	};

	await deleteFile(json)

	const response = await updateFile(json);

	return new Response(JSON.stringify({ ...response }), {
		status: 200,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	});
});

async function isAuthorized(req) {
	const supabaseClient = createClient(
		// Supabase API URL - env var exported by default.
		Deno.env.get('SUPABASE_URL') ?? '',
		// Supabase API ANON KEY - env var exported by default.
		Deno.env.get('SUPABASE_ANON_KEY') ?? '',
		// Create client with Auth context of the user that called the function.
		// This way your row-level-security (RLS) policies are applied.
		{ global: { headers: { Authorization: req.headers.get('Authorization')! } } }
	)
	const {
		data: { user },
	} = await supabaseClient.auth.getUser()
	return user.role === "github_editor"
}

async function getFile(path) {
	const response = await octokit.rest.repos.getContent(
		{
			owner: "hearts-of-iron-2",
			repo: "wiki",
			path: path,
			headers: {
				"X-GitHub-Api-Version": "2022-11-28",
			},
		}
	);
	return response;
}

async function updateFile(json) {
	const { newPath, commitMessage, content } = json;
	const response = await octokit.rest.repos.createOrUpdateFileContents(
		{
			owner: "hearts-of-iron-2",
			repo: "wiki",
			path: newPath,
			message: commitMessage,
			committer: {
				name: "Ivan Dimitrov",
				email: "ivan@idimitrov.dev",
			},
			content: content,
			headers: {
				"X-GitHub-Api-Version": "2022-11-28",
			},
		}
	);
	return response;
}

async function deleteFile(json) {
	const { path, commitMessage, sha } = json;
	const response = await octokit.rest.repos.deleteFile(
		{
			owner: "hearts-of-iron-2",
			repo: "wiki",
			path: path,
			headers: {
				"X-GitHub-Api-Version": "2022-11-28",
			},
			message: commitMessage,
			sha
		}
	);
	return response;
}

