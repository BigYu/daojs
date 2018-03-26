import Promise from 'bluebird';
import _ from 'lodash';
import { convertData } from '../transforms';
import client from '../mock/worker';

// dags
import dags from '../dags';

const {
  fetchCustomerTSADFactory,
} = dags;

const metricsDictionary = {
  Revenue: { revenue: 'sum' },
  UU: { customerId: 'count' },
  TransactionCount: { transactionId: 'count' },
};

const dimensionsDictionary = {
  BranchName: {
    branchName: { type: 'any' },
  },
  CardType: {
    cardType: { type: 'any' },
  },
  SKUType: {
    skuType: { type: 'any' },
  },
};

const groupByDictionary = {
  BranchName: 'branchName',
  CardType: 'cardType',
  SKUType: 'skuType',
};

const simulation = client.call('simulate', {
  startDate: '2018-01-01',
  endDate: '2018-03-31',
  customerCount: 200,
});

export default {
  parameters: {
    measureUser: { default: undefined },
    time: { default: { start: '2018-01-01', end: '2018-02-01' } },
    measureCustomer: { default: undefined },
    granularityCustomer: { default: undefined },
    measureFavor: { default: undefined },
    dimensionFavor: { default: undefined },
    measureGrowth: { default: undefined },
  },
  cells: {
    measureUser: {
      factory: () => Promise.resolve({
        defaultValue: 'UU',
        enums: ['Revenue', 'UU', 'TransactionCount'],
      }),
    },
    bestUser: {
      dependencies: ['@measureUser', '@time'],
      factory: () => Promise.resolve({ department: 'STC', discipline: 'SDE' }),
    },
    measureCustomer: {
      factory: () => Promise.resolve({
        defaultValue: 'UU',
        enums: ['Revenue', 'UU', 'TransactionCount'],
      }),
    },
    bestCustomerQuery: {
      dependencies: ['@time', '@measureCustomer', 'bestUser'],
      factory: (time, measure, bestUser) => Promise.resolve({ time, measure, bestUser }),
    },
    mapCustomerMetric: {
      dependencies: ['@measureCustomer'],
      factory: measure => ({
        Revenue: { revenue: 'sum' },
        UU: { customerId: 'count' },
        TransactionCount: { transactionId: 'count' },
      }[measure]),
    },
    fetchCustomerTSAD: {
      dependencies: ['@time', 'mapCustomerMetric', 'bestUser'],
      factory: fetchCustomerTSADFactory(client, simulation),
    },
    bestCustomerTSAD: {
      dependencies: ['fetchCustomerTSAD', 'mapCustomerMetric', 'bestUser'],
      factory: (data, metric, bestUser) => {
        if (_.some([data, metric, bestUser], _.isNil)) {
          return undefined;
        }
        return {
          source: data,
          axisDimensions: ['timestamp'],
          metricDimensions: _.keys(metric),
        };
      },
    },
    granularityCustomer: {
      factory: () => Promise.resolve({
        defaultValue: 'day',
        enums: ['day', 'week', 'month'],
      }),
    },
    fetchCustomerExpencePerUserBucket: {
      dependencies: ['@time', '@granularityCustomer', 'bestUser'],
      factory: (time, granularity, bestUser) => {
        if (_.some([time, granularity, bestUser], _.isNil)) {
          return Promise.resolve([]);
        }

        return simulation
          .then(({ transaction }) => client.call('dag', {
            transactionData: {
              '@proc': 'read',
              '@args': [
                transaction,
              ],
            },
            step1: {
              '@proc': 'query2',
              '@args': [{
                '@ref': 'transactionData',
              }, {
                aggregation: {
                  revenue: 'sum',
                },
                filter: {
                  timestamp: {
                    type: 'time-range',
                    from: time.start,
                    to: time.end,
                  },
                  ...bestUser,
                },
                groupBy: {
                  timestamp: granularity,
                  customerId: 'value',
                },
              }],
            },
            step2: {
              '@proc': 'query2',
              '@args': [{
                '@ref': 'step1',
              }, {
                aggregation: {
                  revenue: 'average',
                },
                groupBy: {
                  customerId: 'value',
                },
              }],
            },
            result: {
              '@proc': 'query2',
              '@args': [{
                '@ref': 'step2',
              }, {
                aggregation: {
                  customerId: 'count',
                },
                groupBy: {
                  revenue: {
                    type: 'bin',
                    step: 10,
                  },
                },
              }],
            },
          }, 'result'));
      },
    },
    customerExpensePerUserBucket: {
      dependencies: ['fetchCustomerExpencePerUserBucket'],
      factory: (data) => {
        if (!data) {
          return undefined;
        }
        const results = _.map(data, item => [item.revenue, item.customerId]);
        const expectedData = {
          data: results,
          meta: {
            headers: ['revenue', 'customerId'],
          },
        };

        return convertData({
          ...expectedData,
          groupDimensions: [],
          axisDimensions: ['revenue'],
          metricDimensions: ['customerId'],
          serieNameTemplate: 'customerId',
        });
      },
    },
    fetchCustomerExpensePerUserRank: {
      dependencies: ['@time', '@granularityCustomer', 'bestUser'],
      factory: (time, granularity, bestUser) => {
        if (_.some([time, granularity, bestUser], _.isNil)) {
          return Promise.resolve([]);
        }

        return simulation
          .then(({ transaction }) => client.call('dag', {
            transactionData: {
              '@proc': 'read',
              '@args': [
                transaction,
              ],
            },
            stepFilter: {
              '@proc': 'query2',
              '@args': [{
                '@ref': 'transactionData',
              }, {
                aggregation: {
                  revenue: 'sum',
                },
                filter: {
                  timestamp: {
                    type: 'time-range',
                    from: time.start,
                    to: time.end,
                  },
                  ...bestUser,
                },
                groupBy: {
                  customerId: 'value',
                },
              }],
            },
            result: {
              '@proc': 'query2',
              '@args': [{
                '@ref': 'stepFilter',
              }, {
                aggregation: {
                  revenue: 'average',
                },
                groupBy: {
                  customerId: 'value',
                },
                orderBy: ['-revenue'],
                top: 10,
              }],
            },
          }, 'result'));
      },
    },
    customerExpensePerUserRank: {
      dependencies: ['fetchCustomerExpensePerUserRank'],
      factory: (data) => {
        if (!data) {
          return undefined;
        }

        const results = _.map(data, item => [item.customerId, item.revenue]);
        const expectedData = {
          data: results,
          meta: {
            headers: ['customerId', 'revenue'],
          },
        };

        return convertData({
          ...expectedData,
          groupDimensions: [],
          axisDimensions: ['customerId'],
          metricDimensions: ['revenue'],
          serieNameTemplate: 'revenue',
        });
      },
    },
    measureFavor: {
      factory: () => Promise.resolve({
        defaultValue: 'UU',
        enums: ['Revenue', 'UU', 'TransactionCount'],
      }),
    },
    dimensionFavor: {
      factory: () => Promise.resolve({
        defaultValue: 'BranchName',
        enums: ['BranchName', 'CardType', 'SKUType'],
      }),
    },
    fetchFavorBestCustomerReduce: {
      dependencies: ['@time', '@measureFavor', '@dimensionFavor', 'bestUser'],
      factory: (time, measure, dimension, bestUser) => {
        if (_.some([time, measure, dimension, bestUser], _.isNil)) {
          return Promise.resolve([]);
        }

        const aggregation = metricsDictionary[measure];

        return simulation
          .then(({ transaction }) => client.call('dag', {
            transactionData: {
              '@proc': 'read',
              '@args': [
                transaction,
              ],
            },
            result: {
              '@proc': 'query2',
              '@args': [{
                '@ref': 'transactionData',
              }, {
                aggregation,
                filter: {
                  timestamp: {
                    type: 'time-range',
                    from: time.start,
                    to: time.end,
                  },
                  ...bestUser,
                },
                groupBy: {
                  [groupByDictionary[dimension]]: 'value',
                },
              }],
            },
          }, 'result'));
      },
    },
    favorBestCustomerReduce: {
      dependencies: ['fetchFavorBestCustomerReduce', '@measureFavor', '@dimensionFavor'],
      factory: (data, measure, dimension) => {
        const dimensionKey = _.keys(dimensionsDictionary[dimension])[0];
        const measureKey = _.keys(metricsDictionary[measure])[0];

        return Promise.resolve({
          source: [['name', 'value']].concat(_.map(data, item => [item[dimensionKey], item[measureKey]])),
        });
      },
    },
    fetchFavorBestCustomerTrend: {
      dependencies: ['@time', '@measureFavor', '@dimensionFavor', 'bestUser'],
      factory: (time, measure, dimension, bestUser) => {
        if (_.some([time, measure, dimension, bestUser], _.isNil)) {
          return Promise.resolve([]);
        }

        const aggregation = metricsDictionary[measure];

        return simulation
          .then(({ transaction }) => client.call('dag', {
            transactionData: {
              '@proc': 'read',
              '@args': [
                transaction,
              ],
            },
            result: {
              '@proc': 'query2',
              '@args': [{
                '@ref': 'transactionData',
              }, {
                aggregation,
                filter: {
                  timestamp: {
                    type: 'time-range',
                    from: time.start,
                    to: time.end,
                  },
                  ...bestUser,
                },
                groupBy: {
                  timestamp: 'day',
                  [groupByDictionary[dimension]]: 'value',
                },
              }],
            },
          }, 'result'));
      },
    },
    favorBestCustomerTrend: {
      dependencies: ['fetchFavorBestCustomerTrend', '@measureFavor', '@dimensionFavor'],
      factory: (rawData, measure, dimension) => {
        if (_.some([rawData, measure, dimension], _.isNil)) {
          return undefined;
        }

        const dimensionKey = _.keys(dimensionsDictionary[dimension])[0];
        const measureKey = _.keys(metricsDictionary[measure])[0];

        const dataAggregated = _.chain(rawData)
          .groupBy(_.property('timestamp'))
          .mapValues(val => _.reduce(val, (memo, cur) => ({
            [cur[dimensionKey]]: cur[measureKey], ...memo,
          }), {}))
          .value();

        const series = _.uniq(_.reduce(dataAggregated, (memo, cur) => [
          ..._.keys(cur), ...memo], []));

        const source = _.map(dataAggregated, (val, key) => ({
          timestamp: key,
          ..._.zipObject(series, _.map(series, s => val[s] || 0)),
        }));

        return Promise.resolve({
          source,
          axisDimensions: ['timestamp'],
        });
      },
    },

    // Section 4
    fetchUsageMealCardReduce: {
      dependencies: ['@time', 'bestUser'],
      factory: (time, bestUser) => simulation
        .then(({ recharge }) => client.call('query', recharge, {
          aggregation: {
            customerId: 'count',
          },
          filter: {
            timestamp: {
              type: 'time-range',
              from: time.start,
              to: time.end,
            },
            ...bestUser,
          },
          groupBy: {
            cardType: 'value',
          },
        }))
        .then(id => client.call('read', id).finally(() => client.call('remove', id))),
    },
    usageMealCardReduce: {
      dependencies: ['fetchUsageMealCardReduce'],
      factory: data => Promise.resolve({
        title: `共有${_.sum(_.map(data, 'customerId'))}人充值`,
        source: [['name', 'value']].concat(_.map(data, item => [item.cardType, item.customerId])),
      }),
    },
    fetchUsageMealCardBucketCRAP: {
      dependencies: ['@time', 'bestUser'],
      factory: (time, bestUser) => simulation
        .then(({ recharge }) => client.call('query', recharge, {
          aggregation: {
            rechargeAmount: 'sum',
          },
          filter: {
            timestamp: {
              type: 'time-range',
              from: time.start,
              to: time.end,
            },
            ...bestUser,
          },
          groupBy: {
            customerId: 'value',
          },
        }))
        .then(id => client.call('query', id, {
          aggregation: {
            customerId: 'count',
          },
          groupBy: {
            rechargeAmount: {
              type: 'bin',
              step: 200,
            },
          },
        }).finally(() => client.call('remove', id)))
        .then(id => client.call('read', id).finally(() => client.call('remove', id))),
    },
    usageMealCardBucketCRAP: {
      dependencies: ['fetchUsageMealCardBucketCRAP'],
      factory: data => Promise.resolve({
        title: '',
        source: [['name', 'value']].concat(_.map(data, item => [item.rechargeAmount, item.customerId])),
      }),
    },
    usageMealCardQuery: {
      dependencies: ['@time', 'bestUser'],
      factory: (time, bestUser) => Promise.resolve({
        time, bestUser, measure: 'CardBalance',
      }),
    },
    usageMealCardBucketCB: {
      dependencies: ['@time', 'bestUser'],
      factory: (time, bestUser) => Promise.resolve({
        time, bestUser, measure: 'CardBalance',
      }),
    },
    measureGrowth: {
      factory: () => Promise.resolve({
        defaultValue: 'UU',
        enums: ['Revenue', 'UU', 'TransactionCount'],
      }),
    },
    fetchTrendForGrowth: {
      dependencies: ['@time', '@measureGrowth', 'bestUser'],
      factory: (time, measure, bestUser) => {
        if (_.some([time, measure, bestUser], _.isNil)) {
          return Promise.resolve([]);
        }

        const aggregation = metricsDictionary[measure];

        return simulation
          .then(({ transaction }) => client.call('query', transaction, {
            aggregation,
            filter: {
              timestamp: {
                type: 'time-range',
                from: time.start,
                to: time.end,
              },
              ...bestUser,
            },
            groupBy: {
              timestamp: 'day',
            },
          }))
          .then(id => client.call('read', id).finally(() => client.call('remove', id)));
      },
    },
    fetchCumulativeTrend: {
      dependencies: ['fetchTrendForGrowth', '@measureGrowth'],
      factory: (trend, measure) => {
        if (_.some([trend, measure], _.isNil)) {
          return undefined;
        }
        const measureKey = _.keys(metricsDictionary[measure])[0];
        return client.call('cumulative', trend, {
          measureKey,
          timestampKey: 'timestamp',
        });
      },
    },
    fetchGrowthRateTrend: {
      dependencies: ['fetchTrendForGrowth', '@measureGrowth'],
      factory: (trend, measure) => {
        if (_.some([trend, measure], _.isNil)) {
          return undefined;
        }
        const measureKey = _.keys(metricsDictionary[measure])[0];
        return client.call('growthRate', trend, {
          measureKey,
          timestampKey: 'timestamp',
        });
      },
    },
    growthAbilityCumulative: {
      dependencies: ['fetchCumulativeTrend', '@measureGrowth', 'bestUser'],
      factory: (rawData, measure, bestUser) => {
        if (_.some([rawData, measure, bestUser], _.isNil)) {
          return undefined;
        }

        const measureKey = _.keys(metricsDictionary[measure])[0];

        const source = [['time', measureKey]].concat(_.map(rawData, ({ timestamp, value }) =>
          [timestamp, value]));

        return Promise.resolve({ title: '', source });
      },
    },
    growthAbilityGrowthRate: {
      dependencies: ['fetchGrowthRateTrend', '@measureGrowth', 'bestUser'],
      factory: (rawData, measure, bestUser) => {
        if (_.some([rawData, measure, bestUser], _.isNil)) {
          return undefined;
        }

        const measureKey = _.keys(metricsDictionary[measure])[0];

        const source = [['time', measureKey]].concat(_.map(rawData, ({ timestamp, value }) =>
          [timestamp, value]));

        return Promise.resolve({ title: '', source });
      },
    },
  },
  id: '10000',
};
