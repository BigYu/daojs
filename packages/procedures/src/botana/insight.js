import request from 'axios';
import _ from 'lodash';
import constants from './constants.yaml';

const host = _.startsWith(window.location.host, 'localhost') ? constants.host : window.location.host;
export default function getInsightFunc(type) {
  return function insightFunc(params) {
    const uri = `${host}/${constants.path}?type=${type}`;

    return request.post(uri, params, {
      headers: {
        Business: 'Catering',
        Customer: 'Sodexo',
      },
    }).then(({ data }) => data).catch(() => []);
  };
}
