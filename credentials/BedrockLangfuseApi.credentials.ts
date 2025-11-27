import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class BedrockLangfuseApi implements ICredentialType {
	name = 'bedrockLangfuseApi';
	displayName = 'AWS Bedrock + Langfuse API';
	documentationUrl = 'https://docs.aws.amazon.com/bedrock';

	properties: INodeProperties[] = [
		{
			displayName: 'AWS Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'AWS Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'AWS Region',
			name: 'region',
			type: 'string',
			required: true,
			default: 'us-east-1',
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
