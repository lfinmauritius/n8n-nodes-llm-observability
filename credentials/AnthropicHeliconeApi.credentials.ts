import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AnthropicHeliconeApi implements ICredentialType {
	name = 'anthropicHeliconeApi';
	displayName = 'Anthropic + Helicone API';
	documentationUrl = 'https://docs.helicone.ai/integrations/anthropic/javascript';

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
