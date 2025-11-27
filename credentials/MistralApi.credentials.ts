import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MistralApi implements ICredentialType {
	name = 'mistralApi';
	icon = 'file:MistralApi.credentials.svg' as const;
	displayName = 'Mistral API';
	documentationUrl = 'https://docs.mistral.ai/api/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];
}
