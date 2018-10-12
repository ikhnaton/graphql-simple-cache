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
        const startTime = new Date();
        let keyOptions = Object.assign({}, options);
        if ((typeof excludeKeys !== 'undefined') && (excludeKeys !== null))
        {
            const filterKeys = (obj, dropKeys) => 
            {
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

            keyOptions = filterKeys(options, excludeKeys);
        }
        console.log("keyOptions:", JSON.stringify(keyOptions));
        //todo: sort option keys
        let returnValue = this.cache.get(JSON.stringify(keyOptions));
        if (returnValue === null)
        {
            returnValue = await loader(options);
            this.cache.put({
                key: JSON.stringify(keyOptions),
                data: returnValue,
                ttl: ((typeof expiry !== 'undefined') && (expiry !== null)) ? expiry : 0
            })
        }

        const endTime = new Date();
        console.log("Execution Time:", endTime.getTime() - startTime.getTime());
        return returnValue;
    }
}

export { GraphQLSimpleCache }