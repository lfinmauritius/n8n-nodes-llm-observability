import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VllmApiWithLangfuseApi implements ICredentialType {
	name = 'vllmApiWithLangfuseApi';
	icon = 'file:VllmApiWithLangfuseApi.credentials.svg' as const;

	displayName = 'vLLM With Langfuse API';
	documentationUrl = 'https://langfuse.com/integrations/no-code/n8n';

	properties: INodeProperties[] = [
		// vLLM Settings
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'http://localhost:8000/v1',
			description: 'The base URL of your vLLM server (OpenAI-compatible endpoint)',
			hint: 'e.g., http://localhost:8000/v1 or https://your-vllm-server.com/v1',
		},
		{
			displayName: 'API Key (Optional)',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Optional: API key if your vLLM server requires authentication',
		},
		// Langfuse Settings
		{
			displayName: 'Langfuse Base URL',
			name: 'langfuseBaseUrl',
			type: 'string',
			default: 'https://cloud.langfuse.com',
			required: true,
			description: 'The base URL of your Langfuse instance',
		},
		{
			displayName: 'Langfuse Public Key',
			name: 'langfusePublicKey',
			type: 'string',
			default: '',
			typeOptions: { password: true },
			required: true,
		},
		{
			displayName: 'Langfuse Secret Key',
			name: 'langfuseSecretKey',
			type: 'string',
			default: '',
			typeOptions: { password: true },
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl}}',
			url: '/models',
		},
	};
}
