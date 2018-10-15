import { GraphQLSimpleCache } from './index';

describe('index.js - test caching', () =>
{
    test('test that data loads from cache', async (done) => {
        const loader = new GraphQLSimpleCache();

        const mockDataRetriever = jest.fn(({name, age}) => {
            return {
                item1: {
                    name: `${name}-1`,
                    age: age,
                    count: 5 + age
                },
                item2: {
                    name: `${name}-2`,
                    age: age,
                    count: 7 + age
                }
            }
        });

        const run1 = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever});
        const run2 = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever});

        expect(mockDataRetriever.mock.calls.length).toBe(1);
        expect(run1.item1.count).toBe(11);
        expect(run1.item2.count).toBe(13);
        expect(run2.item1.count).toBe(11);
        expect(run2.item2.count).toBe(13);
        done();
    });

    test('test that cache expires data after some time period', async (done) => {
        const loader = new GraphQLSimpleCache();

        const mockDataRetriever = jest.fn(({name, age}) => {
            return {
                item1: {
                    name: `${name}-1`,
                    age: age,
                    count: 5 + age
                },
                item2: {
                    name: `${name}-2`,
                    age: age,
                    count: 7 + age
                }
            }
        });

        const run1 = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever, expiry: 50});
        setTimeout(async () => {
            const run2 = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever, expiry: 50});
    
            expect(mockDataRetriever.mock.calls.length).toBe(2);
            expect(run1.item1.count).toBe(11);
            expect(run1.item2.count).toBe(13);
            expect(run2.item1.count).toBe(11);
            expect(run2.item2.count).toBe(13);
            done();
        }, 200);
    });

    test('test use of an external cache from cache', async (done) => {
        
        const mockDataRetriever = jest.fn(({name, age}) => {
            return {
                item1: {
                    name: `${name}-1`,
                    age: age,
                    count: 5 + age
                },
                item2: {
                    name: `${name}-2`,
                    age: age,
                    count: 7 + age
                }
            }
        });
        
        const customCache = {
            store: {},
            put: (key, data) => customCache.store[key] = data,
            get: (key) => customCache.store[key],
            delete: (key) => customCache.store[key] = null
        };

        const loader = new GraphQLSimpleCache(customCache);
        const run1 = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever});
        const run2 = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever});

        expect(mockDataRetriever.mock.calls.length).toBe(1);
        expect(run1.item1.count).toBe(11);
        expect(run1.item2.count).toBe(13);
        expect(run2.item1.count).toBe(11);
        expect(run2.item2.count).toBe(13);
        done();
    });

    test('test that external cache expires data after some time period', async (done) => {
        const mockDataRetriever = jest.fn(({name, age}) => {
            return {
                item1: {
                    name: `${name}-1`,
                    age: age,
                    count: 5 + age
                },
                item2: {
                    name: `${name}-2`,
                    age: age,
                    count: 7 + age
                }
            }
        });

        const customCache = {
            store: {},
            put: (key, data) => customCache.store[key] = data,
            get: (key) => customCache.store[key],
            delete: (key) => customCache.store[key] = null
        };

        const loader = new GraphQLSimpleCache(customCache);

        const run1 = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever, expiry: 50});
        setTimeout(async () => {
            const run2 = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever, expiry: 50});
    
            expect(mockDataRetriever.mock.calls.length).toBe(2);
            expect(run1.item1.count).toBe(11);
            expect(run1.item2.count).toBe(13);
            expect(run2.item1.count).toBe(11);
            expect(run2.item2.count).toBe(13);
            done();
        }, 200);
    });

    test('test that data loads from cache while excluding a key', async (done) => {
        const loader = new GraphQLSimpleCache();

        const mockDataRetriever = jest.fn(({name, age}) => {
            return {
                item1: {
                    name: `${name}-1`,
                    age: age,
                    count: 5 + age
                },
                item2: {
                    name: `${name}-2`,
                    age: age,
                    count: 7 + age
                }
            }
        });

        const run1 = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        const run2 = await loader.load({options: {age: 8, name: "Bill"}, loader: mockDataRetriever, excludeKeys: ["age"]});

        expect(mockDataRetriever.mock.calls.length).toBe(1);
        expect(run1.item1.count).toBe(11);
        expect(run1.item2.count).toBe(13);
        expect(run2.item1.count).toBe(11);
        expect(run2.item2.count).toBe(13);
        done();
    });

    test('test that loader creates thunk that loads data from fn and from cache', async (done) => {
        const cache = new GraphQLSimpleCache();

        const mockDataRetriever = jest.fn(({name, age}) => {
            return {
                item1: {
                    name: `${name}-1`,
                    age: age,
                    count: 5 + age
                },
                item2: {
                    name: `${name}-2`,
                    age: age,
                    count: 7 + age
                }
            }
        });

        const myLoader = cache.loader({fn: mockDataRetriever});

        const run1 = await myLoader({age: 6, name: "Bill"});
        const run2 = await myLoader({age: 6, name: "Bill"});

        expect(mockDataRetriever.mock.calls.length).toBe(1);
        expect(run1.item1.count).toBe(11);
        expect(run1.item2.count).toBe(13);
        expect(run2.item1.count).toBe(11);
        expect(run2.item2.count).toBe(13);
        done();
    });

    test('test that data can be deleted from cache while by key', async (done) => {
        const loader = new GraphQLSimpleCache();

        const mockDataRetriever = jest.fn(({name, age}) => {
            return {
                item1: {
                    name: `${name}-1`,
                    age: age,
                    count: 5 + age
                },
                item2: {
                    name: `${name}-2`,
                    age: age,
                    count: 7 + age
                }
            }
        });

        const bill = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        const bill2 = await loader.load({options: {age: 7, name: "Bill"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        const bob = await loader.load({options: {age: 8, name: "Bob"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        const bob2 = await loader.load({options: {age: 9, name: "Bob"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        loader.delete({options: {age: 9, name: "Bob"}, excludeKeys: ["age"]});
        const bill3 = await loader.load({options: {age: 11, name: "Bill"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        const bob3 = await loader.load({options: {age: 12, name: "Bob"}, loader: mockDataRetriever, excludeKeys: ["age"]});


        expect(mockDataRetriever.mock.calls.length).toBe(3);
        expect(bill.item1.count).toBe(11);
        expect(bill2.item1.count).toBe(11);
        expect(bill3.item1.count).toBe(11);
        expect(bob.item1.count).toBe(13);
        expect(bob2.item1.count).toBe(13);
        expect(bob3.item1.count).toBe(17);
        done();
    });

    test('test that the cache can be flushed', async (done) => {
        const loader = new GraphQLSimpleCache();

        const mockDataRetriever = jest.fn(({name, age}) => {
            return {
                item1: {
                    name: `${name}-1`,
                    age: age,
                    count: 5 + age
                },
                item2: {
                    name: `${name}-2`,
                    age: age,
                    count: 7 + age
                }
            }
        });

        const bill = await loader.load({options: {age: 6, name: "Bill"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        const bill2 = await loader.load({options: {age: 7, name: "Bill"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        const bob = await loader.load({options: {age: 8, name: "Bob"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        const bob2 = await loader.load({options: {age: 9, name: "Bob"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        loader.flush();
        const bill3 = await loader.load({options: {age: 11, name: "Bill"}, loader: mockDataRetriever, excludeKeys: ["age"]});
        const bob3 = await loader.load({options: {age: 12, name: "Bob"}, loader: mockDataRetriever, excludeKeys: ["age"]});


        expect(mockDataRetriever.mock.calls.length).toBe(4);
        expect(bill.item1.count).toBe(11);
        expect(bill2.item1.count).toBe(11);
        expect(bill3.item1.count).toBe(16);
        expect(bob.item1.count).toBe(13);
        expect(bob2.item1.count).toBe(13);
        expect(bob3.item1.count).toBe(17);
        done();
    });
});