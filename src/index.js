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
        loader,
        expiry
    })
    {
        //todo: sort option keys
        let returnValue = this.cache.get(JSON.stringify(options));
        if (returnValue === null)
        {
            returnValue = await loader(options);
            this.cache.put({
                key: JSON.stringify(options),
                data: returnValue,
                ttl: ((typeof expiry !== 'undefined') && (expiry !== null)) ? expiry : 0
            })
        }
        return returnValue;
    }
}

export { GraphQLSimpleCache }