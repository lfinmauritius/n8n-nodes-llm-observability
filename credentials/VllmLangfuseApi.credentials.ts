import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class VllmLangfuseApi implements ICredentialType {
	name = 'vllmLangfuseApi';
	displayName = 'vLLM + Langfuse API';
	documentationUrl = 'https://docs.vllm.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'vLLM Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'http://localhost:8000/v1',
		},
		{
			displayName: 'API Key (optional)',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Only required if your vLLM server has authentication enabled',
		},
		{
			displayName: 'Langfuse Base URL',
			name: 'langfuseBaseUrl',
			type: 'string',
			default: 'https://cloud.langfuse.com',
			required: true,
		},
		{
			displayName: 'Langfuse Public Key',
			name: 'langfusePublicKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Langfuse Secret Key',
			name: 'langfuseSecretKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];
}
