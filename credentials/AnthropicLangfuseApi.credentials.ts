import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AnthropicLangfuseApi implements ICredentialType {
	name = 'anthropicLangfuseApi';
	displayName = 'Anthropic + Langfuse API';
	documentationUrl = 'https://docs.anthropic.com';

	properties: INodeProperties[] = [
		{
			displayName: 'Anthropic API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
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
