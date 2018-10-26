import { GraphQLSimpleCache } from '../index';
import * as redis from './redis';

describe('index.js - test caching using Redis as an external cache', () =>
{
    beforeAll(async (done) =>
    {
        try 
        {
            await redis.get("hello");
        }
        catch (err)
        {
            // assume redis unavailable
            redis.connected = false;
            console.log("Redis currently unavailable, using in memory cache instead");
        }
        done();
    });

    beforeEach(async (done) =>
    {
        if (redis.connected)
        {
            await redis.flush();
        }
        done();
    });

    afterAll(async (done) =>
    {
        if (redis.connected)
        {
            await redis.flush();
            await redis.quit();
        }
        done();
    });

    test('test that data loads from cache', async (done) => {
        const loader = redis.connected ? new GraphQLSimpleCache(redis) : new GraphQLSimpleCache();

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

    test('test that data loads when cache is not connected', async (done) => {
        const redisState = redis.connected;
        redis.connected = false;
        const loader = new GraphQLSimpleCache(redis);

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

        expect(mockDataRetriever.mock.calls.length).toBe(2);
        expect(run1.item1.count).toBe(11);
        expect(run1.item2.count).toBe(13);
        expect(run2.item1.count).toBe(11);
        expect(run2.item2.count).toBe(13);
        redis.connected = redisState;
        done();
    });

});