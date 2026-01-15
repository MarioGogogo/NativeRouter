/**
 * 云端分包配置服务
 * 从远程 API 获取分包配置信息
 */

const API_URL = 'https://m1.apifoxmock.com/m1/1149415-2096860-default/listdes';

export interface BundleConfig {
  des: string;
  url: string;
  version: string;
}

export interface BundleConfigResponse {
  msg: string;
  code: string;
  results: BundleConfig[];
}

/**
 * 获取云端分包配置
 */
export async function fetchBundleConfig(): Promise<Record<string, { url: string; version: string }>> {
  try {
    console.log('[BundleConfigService] Fetching bundle config from:', API_URL);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BundleConfigResponse = await response.json();
    
    if (data.code !== '200') {
      throw new Error(`API error: ${data.msg}`);
    }

    console.log('[BundleConfigService] Received bundle config:', data.results);

    // 转换为 ScriptManager 需要的格式
    // 从 URL 中提取分包名称（例如：profile.chunk.bundle -> profile）
    const config: Record<string, { url: string; version: string }> = {};
    
    data.results.forEach((item) => {
      const urlParts = item.url.split('/');
      const fileName = urlParts[urlParts.length - 1]; // 例如：profile.chunk.bundle
      const bundleName = fileName.replace('.chunk.bundle', ''); // 提取 profile
      
      config[bundleName] = {
        url: item.url,
        version: item.version,
      };
      
      console.log(`[BundleConfigService] Mapped ${bundleName}:`, config[bundleName]);
    });

    return config;
  } catch (error) {
    console.error('[BundleConfigService] Failed to fetch bundle config:', error);
    throw error;
  }
}

const DEFAULT_CONFIG: Record<string, { url: string; version: string }> = {
  profile: {
    url: 'https://gitee.com/webcc/doudizhu/releases/download/v1.1.12/profile.chunk.bundle',
    version: 'v1.1.12',
  },
  settings: {
    url: 'https://gitee.com/webcc/doudizhu/releases/download/v1.1.14/settings.chunk.bundle',
    version: 'v1.1.14',
  },
  shop: {
    url: 'https://gitee.com/webcc/doudizhu/releases/download/v1.1.9/shop.chunk.bundle',
    version: 'v1.1.9',
  },
  feature: {
    url: 'https://gitee.com/webcc/doudizhu/releases/download/v1.1/feature.chunk.bundle',
    version: 'v1.1',
  },
};

/**
 * 获取云端分包配置（带重试）
 */
export async function fetchBundleConfigWithRetry(maxRetries = 3, retryDelay = 1000): Promise<Record<string, { url: string; version: string }>> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchBundleConfig();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[BundleConfigService] Retry ${i + 1}/${maxRetries} failed:`, error);
      
      if (i < maxRetries - 1) {
        // 等待后重试
        await new Promise<void>(resolve => setTimeout(() => resolve(), retryDelay));
      }
    }
  }
  
  console.warn('[BundleConfigService] All API retries failed, using DEFAULT config fallback.');
  // 如果所有重试都失败，返回默认配置（用于测试或离线场景）
  return DEFAULT_CONFIG;
}
