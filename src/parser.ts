import {
  ComponentsObject,
  ContentObject,
  OpenAPIObject,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
  TagObject,
} from 'openapi3-ts';
import { camelCase, isBoolean, isArray } from 'lodash';
import ReservedDict from 'reserved-words';
import pinyin from 'tiny-pinyin';
import Log from './log';
import _ from 'lodash';

export type ParserResult = {
  modules: ModuleItem[];
  types: TypeItem[];
};
export type TypeItem = {
  name: string;
  props: APIProperty[];
};
export type ParserOptions = { namespace?: string };
export type ModuleItem = {
  name: string;
  desc: string;
  routes: RouteItem[];
};
export type RouteItem = {
  url: string;
  method: string;
  name: string;
  fullName: string;
  desc: string;
  params: RouteParams;
  body: any;
  response: any;
};
export type RouteParams = RouteParamProperty[];
export type RouteParamProperty = APIProperty & { in: 'query' | 'path' };
export type RouteBody = {};
export type RouteResponse = {};
export type APIProperty = {
  name: string;
  desc: string;
  type: string;
  required: boolean;
};

const validMethods = ['get', 'put', 'post', 'delete', 'patch'];
const DEFAULT_OPTIONS: ParserOptions = {
  namespace: 'API',
};

/**
 * OpenAPI 数据解析器
 */
export class OpenapiDataParser {
  private _openAPIData: OpenAPIObject;
  private _result: ParserResult;
  private _options: ParserOptions;

  constructor(openapiData: OpenAPIObject, options?: ParserOptions) {
    this._openAPIData = openapiData;
    this._options = _.merge(DEFAULT_OPTIONS, options);
    this._parse();
  }

  public GetResult() {
    return this._result;
  }

  private _parse() {
    const { tags, paths, components } = this._openAPIData;

    const moduleMap: Record<string, ModuleItem> = {};
    tags.forEach((tag: TagObject) => {
      moduleMap[tag.name] = {
        name: tag.name,
        desc: tag.description,
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
          name: operation.operationId?.split('_').pop(),
          fullName: camelCase(operation.operationId),
          desc: operation.description ?? operation.summary,
          params: this._parseParams(operation.parameters),
          body: this._parseBody(operation.requestBody),
          response: this._parseResponse(operation.responses),
        } as RouteItem);
      });
    });

    const defines = components?.schemas || {};
    const types =
      components &&
      components.schemas &&
      Object.keys(components.schemas).map((typeName) => {
        const result = this._resolveObject(defines[typeName]);

        const getDefinesType = () => {
          if (result.type) {
            return (defines[typeName] as SchemaObject).type === 'object' || result.type;
          }
          return 'Record<string, any>';
        };
        return {
          name: resolveTypeName(typeName),
          props: result.props || [],
        } as TypeItem;
      });

    this._result = {
      modules: Object.values(moduleMap),
      types,
    };
  }

  private _parseParams(parameters: (ParameterObject | ReferenceObject)[]) {
    const routeParams: RouteParams = [];

    if (parameters && parameters.length) {
      parameters.forEach((property) => {
        const p = this._resolveRefObject(property);
        const isDirectObject = (((p.schema || {}) as SchemaObject).type || p.type) === 'object';
        const refList = ((p.schema || {}).$ref || p.$ref || '').split('/');
        const ref = refList[refList.length - 1];
        const deRefObj = (Object.entries(
          (this._openAPIData.components && this._openAPIData.components.schemas) || {},
        ).find(([k]) => k === ref) || []) as any;
        const isRefObject = (deRefObj[1] || {}).type === 'object';
        routeParams.push({
          name: p.name,
          desc: p.description,
          required: p.required,
          type: this._getType(p.schema || DEFAULT_SCHEMA),
          in: p.in,
        });
      });
    }

    return routeParams;
  }

  private _parseBody(requestBody: RequestBodyObject | ReferenceObject) {
    const reqBody: RequestBodyObject = this._resolveRefObject(requestBody);
    if (!reqBody) {
      return null;
    }
    const reqContent: ContentObject = reqBody.content;
    if (typeof reqContent !== 'object') {
      return null;
    }
    let mediaType = Object.keys(reqContent)[0];

    const schema: SchemaObject = reqContent[mediaType].schema || DEFAULT_SCHEMA;

    if (mediaType === '*/*') {
      mediaType = '';
    }
    // 如果 requestBody 有 required 属性，则正常展示；如果没有，默认非必填
    const required =
      typeof (requestBody as RequestBodyObject).required === 'boolean'
        ? (requestBody as RequestBodyObject).required
        : false;
    if (schema.type === 'object' && schema.properties) {
      const propertiesList = Object.keys(schema.properties)
        .map((p) => {
          if (
            schema.properties &&
            schema.properties[p] &&
            !['binary', 'base64'].includes((schema.properties[p] as SchemaObject).format || '') &&
            !(
              ['string[]', 'array'].includes((schema.properties[p] as SchemaObject).type || '') &&
              ['binary', 'base64'].includes(
                ((schema.properties[p] as SchemaObject).items as SchemaObject).format || '',
              )
            )
          ) {
            return {
              key: p,
              schema: {
                ...schema.properties[p],
                type: this._getType(schema.properties[p]),
                required: schema.required?.includes(p) ?? false,
              },
            };
          }
          return undefined;
        })
        .filter((p) => p);
      return {
        mediaType,
        ...schema,
        required,
        propertiesList,
      };
    }
    return {
      mediaType,
      required,
      type: this._getType(schema),
    };
  }

  private _parseResponse(responses: ResponsesObject) {
    const { components } = this._openAPIData;
    const response: ResponseObject | undefined =
      responses &&
      this._resolveRefObject(responses.default || responses['200'] || responses['201']);
    const defaultResponse = {
      mediaType: '*/*',
      type: 'any',
    };
    if (!response) {
      return defaultResponse;
    }
    const resContent: ContentObject | undefined = response.content;
    const resContentMediaTypes = Object.keys(resContent || {});
    const mediaType = resContentMediaTypes.includes('application/json')
      ? 'application/json'
      : resContentMediaTypes[0]; // 优先使用 application/json
    if (typeof resContent !== 'object' || !mediaType) {
      return defaultResponse;
    }
    let schema = (resContent[mediaType].schema || DEFAULT_SCHEMA) as SchemaObject;

    if ('properties' in schema) {
      Object.keys(schema.properties).map((fieldName) => {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        schema.properties[fieldName]['required'] = schema.required?.includes(fieldName) ?? false;
      });
    }
    return {
      mediaType,
      type: this._getType(schema),
    };
  }

  private _resolveObject(schemaObject: SchemaObject) {
    schemaObject = schemaObject ?? {};
    // 引用类型
    if (schemaObject.$ref) {
      return this._resolveRefObject(schemaObject);
    }
    // 枚举类型
    if (schemaObject.enum) {
      return this._resolveEnumObject(schemaObject);
    }
    // 继承类型
    if (schemaObject.allOf && schemaObject.allOf.length) {
      return this._resolveAllOfObject(schemaObject);
    }
    // 对象类型
    if (schemaObject.properties) {
      return this._resolveProperties(schemaObject);
    }
    // 数组类型
    if (schemaObject.items && schemaObject.type === 'array') {
      return this._resolveArray(schemaObject);
    }
    return schemaObject;
  }

  private _resolveArray(schemaObject: SchemaObject) {
    if (schemaObject.items.$ref) {
      const refObj = schemaObject.items.$ref.split('/');
      return {
        type: `${refObj[refObj.length - 1]}[]`,
      };
    }
    // TODO: 这里需要解析出具体属性，但由于 parser 层还不确定，所以暂时先返回 any
    return 'any[]';
  }

  private _resolveProperties(schemaObject: SchemaObject) {
    return {
      props: this._getProps(schemaObject),
    };
  }

  private _resolveRefObject(refObject: any): any {
    if (!refObject || !refObject.$ref) {
      return refObject;
    }
    const refPaths = refObject.$ref.split('/');
    if (refPaths[0] === '#') {
      refPaths.shift();
      let obj: any = this._openAPIData;
      refPaths.forEach((node: any) => {
        obj = obj[node];
      });
      if (!obj) {
        throw new Error(`[GenSDK] Data Error! Notfoud: ${refObject.$ref}`);
      }
      return {
        ...this._resolveRefObject(obj),
        type: obj.$ref ? this._resolveRefObject(obj).type : obj,
      };
    }
    return refObject;
  }

  private _resolveEnumObject(schemaObject: SchemaObject) {
    const enumArray = schemaObject.enum;

    let enumStr;

    enumStr = Array.from(
      new Set(
        enumArray.map((v) =>
          typeof v === 'string' ? `"${v.replace(/"/g, '"')}"` : this._getType(v),
        ),
      ),
    ).join(' | ');

    return {
      type: Array.isArray(enumArray) ? enumStr : 'string',
    };
  }

  private _resolveAllOfObject(schemaObject: SchemaObject) {
    const props = (schemaObject.allOf || []).map((item) =>
      item.$ref ? [{ ...item, type: this._getType(item).split('/').pop() }] : this._getProps(item),
    );

    if (schemaObject.properties) {
      const extProps = this._getProps(schemaObject);
      return { props: [...props, extProps] };
    }

    return { props };
  }

  // 获取 TS 类型的属性列表
  private _getProps(schemaObject: SchemaObject) {
    const requiredPropKeys = schemaObject?.required ?? false;
    return schemaObject.properties
      ? Object.keys(schemaObject.properties).map((propName) => {
          const schema: SchemaObject =
            (schemaObject.properties && schemaObject.properties[propName]) || DEFAULT_SCHEMA;
          // 剔除属性键值中的特殊符号，因为函数入参变量存在特殊符号会导致解析文件失败
          propName = propName.replace(/[\[|\]]/g, '');
          return {
            name: propName,
            type: this._getType(schema),
            desc: [schema.title, schema.description].filter((s) => s).join(' '),
            // 如果没有 required 信息，默认全部是非必填
            required: requiredPropKeys ? requiredPropKeys.some((key) => key === propName) : false,
          } as APIProperty;
        })
      : [];
  }

  private _getType(schemaObject: SchemaObject | undefined) {
    const namespace = this._options.namespace;

    if (schemaObject === undefined || schemaObject === null) {
      return 'any';
    }
    if (typeof schemaObject !== 'object') {
      return schemaObject;
    }
    if (schemaObject.$ref) {
      return [namespace, getRefName(schemaObject)].filter((s) => s).join('.');
    }

    let { type } = schemaObject as any;

    const numberEnum = [
      'integer',
      'long',
      'float',
      'double',
      'number',
      'int',
      'float',
      'double',
      'int32',
      'int64',
    ];

    const dateEnum = ['Date', 'date', 'dateTime', 'date-time', 'datetime'];

    const stringEnum = ['string', 'email', 'password', 'url', 'byte', 'binary'];

    if (type === 'null') {
      return 'null';
    }

    if (numberEnum.includes(schemaObject.format)) {
      type = 'number';
    }

    if (schemaObject.enum) {
      type = 'enum';
    }

    if (numberEnum.includes(type)) {
      return 'number';
    }

    if (dateEnum.includes(type)) {
      return 'Date';
    }

    if (stringEnum.includes(type)) {
      return 'string';
    }

    if (type === 'boolean') {
      return 'boolean';
    }

    if (type === 'array') {
      let { items } = schemaObject;
      if (schemaObject.schema) {
        items = schemaObject.schema.items;
      }

      if (Array.isArray(items)) {
        const arrayItemType = (items as any)
          .map((subType) => this._getType(subType.schema || subType))
          .toString();
        return `[${arrayItemType}]`;
      }
      const arrayType = this._getType(items);
      return arrayType.includes(' | ') ? `(${arrayType})[]` : `${arrayType}[]`;
    }

    if (type === 'enum') {
      return Array.isArray(schemaObject.enum)
        ? Array.from(
            new Set(
              schemaObject.enum.map((v) =>
                typeof v === 'string' ? `"${v.replace(/"/g, '"')}"` : this._getType(v),
              ),
            ),
          ).join(' | ')
        : 'string';
    }

    if (schemaObject.oneOf && schemaObject.oneOf.length) {
      return schemaObject.oneOf.map((item) => this._getType(item)).join(' | ');
    }
    if (schemaObject.anyOf && schemaObject.anyOf.length) {
      return schemaObject.anyOf.map((item) => this._getType(item)).join(' | ');
    }
    if (schemaObject.allOf && schemaObject.allOf.length) {
      return `(${schemaObject.allOf.map((item) => this._getType(item)).join(' & ')})`;
    }
    if (schemaObject.type === 'object' || schemaObject.properties) {
      if (!Object.keys(schemaObject.properties || {}).length) {
        return 'Record<string, any>';
      }
      return `{ ${Object.keys(schemaObject.properties)
        .map((key) => {
          let required = false;
          if (isBoolean(schemaObject.required) && schemaObject.required) {
            required = true;
          }
          if (isArray(schemaObject.required) && schemaObject.required.includes(key)) {
            required = true;
          }
          if (
            'required' in (schemaObject.properties[key] || {}) &&
            ((schemaObject.properties[key] || {}) as any).required
          ) {
            required = true;
          }
          /**
           * 将类型属性变为字符串，兼容错误格式如：
           * 3d_tile(数字开头)等错误命名，
           * 在后面进行格式化的时候会将正确的字符串转换为正常形式，
           * 错误的继续保留字符串。
           * */
          return `'${key}'${required ? '' : '?'}: ${this._getType(
            schemaObject.properties && schemaObject.properties[key],
          )}; `;
        })
        .join('')}}`;
    }
    return 'any';
  }
}

function getRefName(refObject: any): string {
  if (typeof refObject !== 'object' || !refObject.$ref) {
    return refObject;
  }
  const refPaths = refObject.$ref.split('/');
  return resolveTypeName(refPaths[refPaths.length - 1]) as string;
}

// 类型声明过滤关键字
const resolveTypeName = (typeName: string) => {
  if (ReservedDict.check(typeName)) {
    return `__openAPI__${typeName}`;
  }
  const typeLastName = getTypeLastName(typeName);

  const name = typeLastName
    .replace(/[-_ ](\w)/g, (_all, letter) => letter.toUpperCase())
    .replace(/[^\w^\s^\u4e00-\u9fa5]/gi, '');

  // 当model名称是number开头的时候，ts会报错。这种场景一般发生在后端定义的名称是中文
  if (name === '_' || /^\d+$/.test(name)) {
    Log('⚠️  models不能以number开头，原因可能是Model定义名称为中文, 建议联系后台修改');
    return `Pinyin_${name}`;
  }
  if (!/[\u3220-\uFA29]/.test(name) && !/^\d$/.test(name)) {
    return name;
  }
  const noBlankName = name.replace(/ +/g, '');
  return pinyin.convertToPinyin(noBlankName, '', true);
};

// 兼容C#泛型的typeLastName取法
function getTypeLastName(typeName) {
  const tempTypeName = typeName || '';

  const childrenTypeName = tempTypeName?.match(/\[\[.+\]\]/g)?.[0];
  if (!childrenTypeName) {
    let publicKeyToken = (tempTypeName.split('PublicKeyToken=')?.[1] ?? '').replace('null', '');
    const firstTempTypeName = tempTypeName.split(',')?.[0] ?? tempTypeName;
    let typeLastName = firstTempTypeName.split('/').pop().split('.').pop();
    if (typeLastName.endsWith('[]')) {
      typeLastName = typeLastName.substring(0, typeLastName.length - 2) + 'Array';
    }
    // 特殊处理C#默认系统类型，不追加publicKeyToken
    const isCsharpSystemType = firstTempTypeName.startsWith('System.');
    if (!publicKeyToken || isCsharpSystemType) {
      return typeLastName;
    }
    return `${typeLastName}_${publicKeyToken}`;
  }
  const currentTypeName = getTypeLastName(tempTypeName.replace(childrenTypeName, ''));
  const childrenTypeNameLastName = getTypeLastName(
    childrenTypeName.substring(2, childrenTypeName.length - 2),
  );
  return `${currentTypeName}_${childrenTypeNameLastName}`;
}
const DEFAULT_SCHEMA: SchemaObject = {
  type: 'object',
  properties: { id: { type: 'number' } },
};
const DEFAULT_PATH_PARAM: ParameterObject = {
  in: 'path',
  name: null,
  schema: {
    type: 'string',
  },
  required: true,
  isObject: false,
  type: 'string',
};
