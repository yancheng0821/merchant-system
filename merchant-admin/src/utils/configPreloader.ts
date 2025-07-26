// 配置预加载器 - 在应用启动时预加载商户配置
export interface MerchantConfig {
    merchantId: number;
    resourceTypes: ('STAFF' | 'ROOM')[];
}

class ConfigPreloader {
    private static instance: ConfigPreloader;
    private configCache: Map<number, MerchantConfig> = new Map();
    private loadingPromises: Map<number, Promise<MerchantConfig>> = new Map();

    static getInstance(): ConfigPreloader {
        if (!ConfigPreloader.instance) {
            ConfigPreloader.instance = new ConfigPreloader();
        }
        return ConfigPreloader.instance;
    }

    // 预加载配置
    async preloadConfig(tenantId: number): Promise<MerchantConfig> {
        // 如果已经有缓存，直接返回
        if (this.configCache.has(tenantId)) {
            return this.configCache.get(tenantId)!;
        }

        // 如果正在加载，返回加载Promise
        if (this.loadingPromises.has(tenantId)) {
            return this.loadingPromises.get(tenantId)!;
        }

        // 检查localStorage缓存
        const cacheKey = `merchant_config_${tenantId}`;
        const cachedConfig = localStorage.getItem(cacheKey);

        if (cachedConfig) {
            try {
                const config = JSON.parse(cachedConfig);
                this.configCache.set(tenantId, config);

                // 后台刷新配置
                this.refreshConfigInBackground(tenantId);

                return config;
            } catch (e) {
                console.warn('缓存配置解析失败:', e);
            }
        }

        // 创建加载Promise
        const loadingPromise = this.loadConfigFromAPI(tenantId);
        this.loadingPromises.set(tenantId, loadingPromise);

        try {
            const config = await loadingPromise;
            this.configCache.set(tenantId, config);
            localStorage.setItem(cacheKey, JSON.stringify(config));
            return config;
        } finally {
            this.loadingPromises.delete(tenantId);
        }
    }

    // 从API加载配置
    private async loadConfigFromAPI(tenantId: number): Promise<MerchantConfig> {
        try {
            const { merchantConfigApi } = await import('../services/api');
            return await merchantConfigApi.getMerchantConfig(tenantId);
        } catch (err) {
            console.error('获取商户配置失败:', err);
            // 返回默认配置
            return {
                merchantId: tenantId,
                resourceTypes: ['STAFF']
            };
        }
    }

    // 后台刷新配置
    private async refreshConfigInBackground(tenantId: number): Promise<void> {
        try {
            const freshConfig = await this.loadConfigFromAPI(tenantId);
            const cachedConfig = this.configCache.get(tenantId);

            // 如果配置有变化，更新缓存
            if (JSON.stringify(cachedConfig) !== JSON.stringify(freshConfig)) {
                this.configCache.set(tenantId, freshConfig);
                const cacheKey = `merchant_config_${tenantId}`;
                localStorage.setItem(cacheKey, JSON.stringify(freshConfig));

                // 可以在这里触发配置更新事件
                this.notifyConfigUpdate(tenantId, freshConfig);
            }
        } catch (err) {
            console.warn('后台刷新配置失败:', err);
        }
    }

    // 通知配置更新
    private notifyConfigUpdate(tenantId: number, config: MerchantConfig): void {
        // 触发自定义事件，通知组件配置已更新
        window.dispatchEvent(new CustomEvent('merchantConfigUpdated', {
            detail: { tenantId, config }
        }));
    }

    // 获取缓存的配置
    getCachedConfig(tenantId: number): MerchantConfig | null {
        return this.configCache.get(tenantId) || null;
    }

    // 清除缓存
    clearCache(tenantId?: number): void {
        if (tenantId) {
            this.configCache.delete(tenantId);
            localStorage.removeItem(`merchant_config_${tenantId}`);
        } else {
            this.configCache.clear();
            // 清除所有相关的localStorage缓存
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('merchant_config_')) {
                    localStorage.removeItem(key);
                }
            });
        }
    }
}

export const configPreloader = ConfigPreloader.getInstance();

// 在应用启动时预加载当前用户的配置
export const initializeConfigPreloader = (): void => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const tenantId = user.tenantId;

        if (tenantId) {
            // 异步预加载，不阻塞应用启动
            configPreloader.preloadConfig(tenantId).catch(err => {
                console.warn('预加载配置失败:', err);
            });
        }
    } catch (err) {
        console.warn('初始化配置预加载器失败:', err);
    }
};