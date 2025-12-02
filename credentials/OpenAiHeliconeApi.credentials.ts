import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OpenAiHeliconeApi implements ICredentialType {
	name = 'openAiHeliconeApi';
	displayName = 'OpenAI + Helicone API';
	documentationUrl = 'https://docs.helicone.ai/integrations/openai/javascript';

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
			displayName: 'Helicone API Key',
			name: 'heliconeApiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Helicone API key from helicone.ai dashboard',
		},
	];
}
