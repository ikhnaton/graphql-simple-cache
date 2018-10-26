import { realpathSync } from "fs";

const filterKeys = (obj, dropKeys) => 
{
    if ((typeof obj === 'undefined') || (obj === null))
    {
        return obj;
    }
    return Object.keys(obj).reduce((accum, key) => {
        if (!dropKeys.includes(key))
        {
            if (typeof obj[key] === 'object')
            {
                accum[key] = filterKeys(obj[key], dropKeys);
            }
            else
            {
                accum[key] = obj[key];
            }
        }
        return accum;
    }, {});
}
class GraphQLSimpleCache
{
    /**
     * 
     * @param {*} externalCache - object with put, get & delete methods to store/retrieve/delete from the external cache of your choosing
     */ 
    constructor(externalCache)
    {
        if ((typeof externalCache === 'undefined') || (externalCache === null))
        {
            this.store = {};
            this.cache = {
                put: async ({key, data, ttl = 0}) => {
                    if (typeof key !== 'undefined')
                    {
                        this.store[key] = {data, ttl, created: (new Date()).getTime()};
                    }
                },
                get: async (key) => {
                    let ref = this.store[key];
                    if ((typeof ref !== 'undefined') && (ref !== null))
                    {
                        if ((ref.ttl === 0) || (((new Date()).getTime() - ref.created) < ref.ttl))
                        {
                            return ref.data;
                        }
                        else
                        {
                            this.cache.delete(key);
                        }
                    }
                    return null;
                },
                delete: async (key) => {
                    this.store[key] = null;
                },
                flush: async () => {
                    this.store = {};
                },
                prime: async (obj) => {
                    this.store = obj;
                },
                dump: async () => {
                    return this.store;
                }
            };
        }
        else
        {
            this.cache = {
                put: async ({key, data, ttl = 0}) => {
                    if (externalCache.connected === false) return;
                    if (typeof key !== 'undefined')
                    {
                        await externalCache.put(key, {data, ttl, created: (new Date()).getTime()});
                    }
                },
                get: async (key) => {
                    if (externalCache.connected === false) return null;
                    let ref = await externalCache.get(key);
                    if ((typeof ref !== 'undefined') && (ref !== null))
                    {
                        if ((ref.ttl === 0) || (((new Date()).getTime() - ref.created) < ref.ttl))
                        {
                            return ref.data;
                        }
                        else
                        {
                            await this.cache.delete(key);
                        }
                    }
                    return null;
                },
                delete: async (key) => {
                    if (externalCache.connected === false) return;
                    await externalCache.delete(key);
                },
                flush: async () => {
                    if (externalCache.connected === false) return;
                    await externalCache.flush();
                },
                prime: async (obj) => {
                    if (externalCache.connected === false) return;
                    if (typeof externalCache.prime === 'function')
                    {
                        await externalCache.prime(obj);
                    }
                    else
                    {
                        throw new Error("External cache does not support priming");
                    }
                },
                dump: async (obj) => {
                    if (externalCache.connected === false) return null;
                    if (typeof externalCache.dump === 'function')
                    {
                        return externalCache.dump(obj);
                    }
                    else
                    {
                        throw new Error("External cache does not support dumping");
                    }
                }
            };
        }
    }

    /**
     * 
     * @param {*}  
     */
    async load({
        options,
        excludeKeys,
        altKey,
        loader,
        expiry
    })
    {
        let keyOptions = altKey || Object.assign({}, options);
        if ((typeof excludeKeys !== 'undefined') && (excludeKeys !== null))
        {
            keyOptions = filterKeys(options, excludeKeys);
        }
        
        //todo: sort option keys
        let returnValue = await this.cache.get(JSON.stringify(keyOptions));
        if (returnValue === null)
        {
            try
            {
                returnValue = await loader(options);
                await this.cache.put({
                    key: JSON.stringify(keyOptions),
                    data: returnValue,
                    ttl: ((typeof expiry !== 'undefined') && (expiry !== null)) ? expiry : 0
                })
            }
            catch (error)
            {
                console.log(error);
            }
        }

        return returnValue;
    }

    loader({
        fn,
        excludeKeys,
        altKey,
        expiry
    })
    {
        return async (options) => await this.load({
            options, 
            excludeKeys,
            altKey,
            loader: fn,
            expiry
        })
    }

    async delete({options, excludeKeys, altKey})
    {
        let keyOptions = altKey || Object.assign({}, options);
        if ((typeof excludeKeys !== 'undefined') && (excludeKeys !== null))
        {
            keyOptions = filterKeys(options, excludeKeys);
        }
        await this.cache.delete(JSON.stringify(keyOptions));
    }

    async flush()
    {
        await this.cache.flush();
    }

    async prime(obj)
    {
        await this.cache.prime(obj);
    }

    async dump()
    {
        return await this.cache.dump();
    }
}

export { GraphQLSimpleCache }