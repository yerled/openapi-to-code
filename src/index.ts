/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import http from 'http';
import https from 'https';
import fetch from 'node-fetch';
import type { OpenAPIObject, OperationObject, SchemaObject } from 'openapi3-ts';
import converter from 'swagger2openapi';
import Log from './log';
import { ServiceGenerator, ServiceGeneratorConfig } from './generator/services';
import { OpenapiDataParser } from './parser';
import { IGeneratorConfig } from './generator/_base';

const getImportStatement = (requestLibPath: string) => {
  if (requestLibPath && requestLibPath.startsWith('import')) {
    return requestLibPath;
  }
  if (requestLibPath) {
    return `import request from '${requestLibPath}'`;
  }
  return `import { request } from "umi"`;
};

export type GenerateCodeOptions = IGeneratorConfig & {
  schemaPath: string;
  service?: false | ServiceGeneratorConfig;
};

const converterSwaggerToOpenApi = (swagger: any) => {
  if (!swagger.swagger) {
    return swagger;
  }
  return new Promise((resolve, reject) => {
    converter.convertObj(swagger, {}, (err, options) => {
      Log(['💺 将 Swagger 转化为 openAPI']);
      if (err) {
        reject(err);
        return;
      }
      resolve(options.openapi);
    });
  });
};

export const getSchema = async (schemaPath: string) => {
  if (schemaPath.startsWith('http')) {
    const protocol = schemaPath.startsWith('https:') ? https : http;
    try {
      const agent = new protocol.Agent({
        rejectUnauthorized: false,
      });
      const json = await fetch(schemaPath, { agent }).then((rest) => rest.json());
      return json;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('fetch openapi error:', error);
    }
    return null;
  }
  if (require.cache[schemaPath]) {
    delete require.cache[schemaPath];
  }
  const schema = require(schemaPath);
  return schema;
};

const getOpenAPIConfig = async (schemaPath: string) => {
  const schema = await getSchema(schemaPath);
  if (!schema) {
    return null;
  }
  const openAPI = await converterSwaggerToOpenApi(schema);
  return openAPI;
};

// 从 appName 生成 service 数据
export const generateCode = async ({ schemaPath, basePath, service }: GenerateCodeOptions) => {
  const openAPI = await getOpenAPIConfig(schemaPath);
  // const requestImportStatement = getImportStatement(requestLibPath);

  const parser = new OpenapiDataParser(openAPI);

  if (service !== false) {
    const serviceGenerator = new ServiceGenerator(
      parser,
      Object.assign({ basePath }, service ?? {}),
    );
    serviceGenerator.Generate();
  }
};
