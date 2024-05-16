import path from 'path';
import { generateCode } from '../src';

generateCode({
  // requestLibPath: "import { request, RequestOptions } from '@umijs/max';",
  // requestOptionsType: 'RequestOptions',
  // schemaPath: path.resolve(
  //   __dirname,
  //   '../../../yuanguanglong/popmart-land/apps/admin/config/server-openapi.json',
  // ),
  schemaPath: 'http://localhost:3001/api-json',
  basePath: './src-temp/server',
  // enumStyle: 'enum',
  // serversPath: path.resolve(__dirname, './services'),
  // projectName: 'server-openapi',
});
