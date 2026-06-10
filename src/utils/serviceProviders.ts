import type { AppSettings, ServiceProviderId, ServiceTokens } from '@/types';

export interface ServiceProviderMeta {
  id: ServiceProviderId;
  name: string;
  description: string;
  placeholder: string;
  docsUrl: string;
}

export const SERVICE_PROVIDERS: ServiceProviderMeta[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: '用于仓库管理、Issue、Pull Request 等 GitHub API 操作',
    placeholder: 'ghp_xxxxxxxxxxxx',
    docsUrl: 'https://github.com/settings/tokens',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: '用于 DNS、Pages、Workers 等 Cloudflare API 操作',
    placeholder: 'Cloudflare API Token',
    docsUrl: 'https://dash.cloudflare.com/profile/api-tokens',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: '用于站点部署、域名绑定等 Netlify API 操作',
    placeholder: 'nfp_xxxxxxxxxxxx',
    docsUrl: 'https://app.netlify.com/user/applications#personal-access-tokens',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: '用于项目部署、域名管理等 Vercel API 操作',
    placeholder: 'xxxxxxxxxxxx',
    docsUrl: 'https://vercel.com/account/tokens',
  },
];

export function defaultServiceTokens(): ServiceTokens {
  return {
    github: '',
    cloudflare: '',
    netlify: '',
    vercel: '',
  };
}

export function getServiceToken(settings: AppSettings, providerId: ServiceProviderId): string {
  return settings.serviceTokens[providerId] ?? '';
}

export function hasServiceToken(settings: AppSettings, providerId: ServiceProviderId): boolean {
  return getServiceToken(settings, providerId).trim().length > 0;
}
