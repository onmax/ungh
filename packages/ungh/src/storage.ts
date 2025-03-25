import { createStorage } from "unstorage";
import lruCacheDriver, { type LRUDriverOptions } from "unstorage/drivers/lru-cache";


const commonCacheOptions: LRUDriverOptions = {
  max: 60 * 60 * 6, // 6 hours
  allowStale: true,
};

export const storage = createStorage({ driver: lruCacheDriver(commonCacheOptions) });
