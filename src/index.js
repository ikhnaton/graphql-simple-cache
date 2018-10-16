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
                put: ({key, data, ttl = 0}) => {
                    if (typeof key !== 'undefined')
                    {
                        this.store[key] = {data, ttl, created: (new Date()).getTime()};
                    }
                },
                get: (key) => {
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
                delete: (key) => {
                    this.store[key] = null;
                },
                flush: () => {
                    this.store = {};
                },
                prime: (obj) => {
                    this.store = obj;
                },
                dump: () => {
                    return this.store;
                }
            };
        }
        else
        {
            this.cache = {
                put: ({key, data, ttl = 0}) => {
                    if (typeof key !== 'undefined')
                    {
                        externalCache.put(key, {data, ttl, created: (new Date()).getTime()});
                    }
                },
                get: (key) => {
                    let ref = externalCache.get(key);
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
                delete: (key) => {
                    externalCache.delete(key);
                },
                flush: () => {
                    externalCache.fliush();
                },
                prime: (obj) => {
                    if (typeof externalCache.prime === 'function')
                    {
                        externalCache.prime(obj);
                    }
                    else
                    {
                        throw new Error("External cache does not support priming");
                    }
                },
                dump: (obj) => {
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
        loader,
        expiry
    })
    {
        let keyOptions = Object.assign({}, options);
        if ((typeof excludeKeys !== 'undefined') && (excludeKeys !== null))
        {
            keyOptions = filterKeys(options, excludeKeys);
        }
        
        //todo: sort option keys
        let returnValue = this.cache.get(JSON.stringify(keyOptions));
        if (returnValue === null)
        {
            try
            {
                returnValue = await loader(options);
                this.cache.put({
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
        expiry
    })
    {
        return async (options) => await this.load({
            options, 
            excludeKeys,
            loader: fn,
            expiry
        })
    }

    delete({options, excludeKeys})
    {
        let keyOptions = Object.assign({}, options);
        if ((typeof excludeKeys !== 'undefined') && (excludeKeys !== null))
        {
            keyOptions = filterKeys(options, excludeKeys);
        }
        this.cache.delete(JSON.stringify(keyOptions));
    }

    flush()
    {
        this.cache.flush();
    }

    prime(obj)
    {
        this.cache.prime(obj);
    }

    dump()
    {
        return this.cache.dump();
    }
}

export { GraphQLSimpleCache }