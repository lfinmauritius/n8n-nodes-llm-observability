import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GrokLangfuseApi implements ICredentialType {
	name = 'grokLangfuseApi';
	displayName = 'xAI Grok + Langfuse API';
	documentationUrl = 'https://docs.x.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'xAI API Key',
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
