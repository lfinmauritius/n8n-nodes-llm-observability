import type {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class LangfuseObsApi implements ICredentialType {
    name = 'langfuseObsApi';
    icon = 'file:LangfuseObsApi.credentials.svg' as const;

    displayName = 'Langfuse Observability API';
    documentationUrl = 'https://langfuse.com/docs';

    properties: INodeProperties[] = [
        {
            displayName: 'Langfuse Base URL',
            name: 'baseUrl',
            type: 'string',
            default: 'https://cloud.langfuse.com',
            required: true,
            description: 'The base URL of your Langfuse instance',
        },
        {
            displayName: 'Langfuse Public Key',
            name: 'publicKey',
            type: 'string',
            default: '',
            typeOptions: { password: true },
            required: true,
            description: 'Your Langfuse project public key',
        },
        {
            displayName: 'Langfuse Secret Key',
            name: 'secretKey',
            type: 'string',
            default: '',
            typeOptions: { password: true },
            required: true,
            description: 'Your Langfuse project secret key',
        },
    ];
}
