import path from 'path';
import { generateCode } from '../src';

generateCode({
  _debug: true,
  schemaPath: 'http://localhost:3001/api-json',
  // schemaPath: path.resolve(
  //   __dirname,
  //   '../../../yuanguanglong/popmart-land/apps/admin/config/server-openapi.json',
  // ),
  basePath: '/Users/yerled/Documents/yuanguanglong/popmart-land/apps/admin/src/_openapi',
  service: {
    controllerHeader: "import { request, type RequestOptions } from '@umijs/max';",
    // serviceFolder: 'services',
    requestOptionsType: 'RequestOptions',
  },
  // components: {

  // },
  page: {
    // pageFolder: 'pages',
  },
});
