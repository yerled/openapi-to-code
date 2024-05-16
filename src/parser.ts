import { OpenAPIObject, OperationObject, TagObject } from 'openapi3-ts';

type ModuleItem = {
  name: string;
  description: string;
  routes: RouteItem[];
};
type RouteItem = {
  url: string;
  method: string;
  params: any;
  body: any;
  response: any;
  description: string;
};

const validMethods = ['get', 'put', 'post', 'delete', 'patch'];

/**
 * OpenAPI 数据解析器
 */
export class OpenapiDataParser {
  private _openAPIData: OpenAPIObject;
  private _result: ModuleItem[];

  constructor(openapiData: OpenAPIObject) {
    this._openAPIData = openapiData;
    this._parse();
  }

  private _parse() {
    const { tags, paths, components } = this._openAPIData;

    const moduleMap: Record<string, ModuleItem> = {};
    tags.forEach((tag: TagObject) => {
      moduleMap[tag.name] = {
        name: tag.name,
        description: tag.description,
        routes: [],
      };
    });

    Object.entries(paths).forEach(([path, pathConfig]) => {
      validMethods.forEach((method) => {
        const operation = pathConfig[method] as OperationObject;
        if (!operation) {
          return;
        }

        const tag = operation.tags?.[0];
        if (!tag || !moduleMap[tag]) {
          return;
        }

        moduleMap[tag].routes.push({
          url: path,
          method,
          params: operation.parameters,
          body: operation.requestBody,
          response: operation.responses,
          description: operation.description ?? operation.summary,
        } as RouteItem);
      });
    });

    this._result = Object.values(moduleMap);
  }

  public GetResult() {
    return this._result;
  }
}
