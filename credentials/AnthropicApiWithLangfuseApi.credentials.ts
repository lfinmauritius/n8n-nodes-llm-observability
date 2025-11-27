import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AnthropicApiWithLangfuseApi implements ICredentialType {
	name = 'anthropicApiWithLangfuseApi';
	icon = 'file:AnthropicApiWithLangfuseApi.credentials.svg' as const;

	displayName = 'Anthropic With Langfuse API';
	documentationUrl = 'https://langfuse.com/integrations/no-code/n8n';

	properties: INodeProperties[] = [
		// Anthropic Settings
		{
			displayName: 'Anthropic API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Anthropic Base URL',
			name: 'url',
			type: 'string',
			default: 'https://api.anthropic.com',
			description: 'Override the default base URL for the API',
		},
		{
			displayName: 'Add Custom Headers',
			name: 'customHeaders',
			type: 'boolean',
			default: false,
			description: 'Whether to add custom headers to the request',
		},
		{
			displayName: 'Header Name',
			name: 'headerName',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					customHeaders: [true],
				},
			},
		},
		{
			displayName: 'Header Value',
			name: 'headerValue',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					customHeaders: [true],
				},
			},
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
				'x-api-key': '={{$credentials.apiKey}}',
				'anthropic-version': '2023-06-01',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.url || "https://api.anthropic.com"}}',
			url: '/v1/messages',
			method: 'POST',
			body: {
				model: 'claude-3-haiku-20240307',
				max_tokens: 1,
				messages: [{ role: 'user', content: 'test' }],
			},
		},
	};
}
