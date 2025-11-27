import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OpenAiLangfuseApi implements ICredentialType {
	name = 'openAiLangfuseApi';
	displayName = 'OpenAI + Langfuse API';
	documentationUrl = 'https://platform.openai.com/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'OpenAI API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'OpenAI Base URL (optional)',
			name: 'url',
			type: 'string',
			default: '',
			description: 'Custom base URL for OpenAI API',
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
