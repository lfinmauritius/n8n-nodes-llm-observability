import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class VllmApi implements ICredentialType {
	name = 'vllmApi';
	icon = 'file:VllmApi.credentials.svg' as const;
	displayName = 'vLLM API';
	documentationUrl = 'https://docs.vllm.ai/';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'http://localhost:8000/v1',
			description: 'The base URL of your vLLM server',
		},
		{
			displayName: 'API Key (optional)',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Only required if your vLLM server has authentication enabled',
		},
	];
}
