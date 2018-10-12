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
});