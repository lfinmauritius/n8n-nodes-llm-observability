import { getProxyForUrl } from 'proxy-from-env';
import { Agent } from 'undici';

export function getProxyAgent(url: string): Agent | undefined {
	const proxyUrl = getProxyForUrl(url);
	if (!proxyUrl) {
		return undefined;
	}

	return new Agent({
		connect: {
			timeout: 30000,
		},
	});
}
