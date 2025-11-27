import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AnthropicApi implements ICredentialType {
	name = 'anthropicApi';
	icon = 'file:AnthropicApi.credentials.svg' as const;

	displayName = 'Anthropic API';
	documentationUrl = 'https://docs.anthropic.com/en/api/getting-started';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Base URL',
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
		},
		{
			displayName: 'Header Name',
			name: 'headerName',
			type: 'string',
			default: '',
			displayOptions: { show: { customHeaders: [true] } },
		},
		{
			displayName: 'Header Value',
			name: 'headerValue',
			type: 'string',
			default: '',
			displayOptions: { show: { customHeaders: [true] } },
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
