import Handlebars from 'handlebars';
import { BaseGenerator, IGeneratorConfig } from './_base';
import { ModuleItem, OpenapiDataParser, RouteItem } from '../parser';
import Log from '../log';
import path from 'path';
import _ from 'lodash';
import { TableConfig, TablePage } from './pages.template';

export type PageGeneratorConfig = IGeneratorConfig & {
  pageFolder?: string;
};

const DEFAULT_PAGE_CONFIG: PageGeneratorConfig = {
  pageFolder: 'pages',
};

export class PageGenerator extends BaseGenerator {
  config: PageGeneratorConfig;

  constructor(parser: OpenapiDataParser, config: PageGeneratorConfig) {
    super(parser, _.merge(DEFAULT_PAGE_CONFIG, config));
  }

  public Generate() {
    // TODO clear old files

    this._generatePages();

    // 打印日志
    Log(`✅ PageGenerator Generate success!`);
  }

  private _generatePages() {
    this.data.modules?.forEach((module) => {
      module.routes.forEach((route) => {
        if (isPageAPI(route)) {
          this._generateTablePage(module, route);
        }
      });
    });
  }

  private _generateTablePage(module: ModuleItem, route: RouteItem) {
    const capitalizedModuleName = _.capitalize(_.camelCase(`${module.name}`));
    const entity = defaultGetEntityFromRoute(route);
    const deleteRoute = module.routes.find(isDeleteAPI);
    const detailRoute = module.routes.find(isDetailAPI);
    const params = {
      debug: this.config.debug,
      namespace: this.config.namespace,
      moduleName: module.name,
      moduleDesc: module.desc,
      entity: this._getTypeByName(entity),
      columnMap: `${capitalizedModuleName}ColumnMap`,
      table: `${capitalizedModuleName}Table`,
      service: `${module.name}Service`,
      tableRoute: route,
      deleteRoute,
      detailRoute,
    };
    this._generateTableConfig(module, params);
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `${_.capitalize(_.camelCase(`${module.name}`))}Table.tsx`,
      template: TablePage,
      params,
    });
  }

  private _generateTableConfig(module: ModuleItem, params: Record<string, any>) {
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `tableConfig.tsx`,
      template: TableConfig,
      params,
    });
  }

  private _getTypeByName(name: string) {
    return this.data.types?.find((type) => type.name === name);
  }
}

function isPageAPI(route: RouteItem) {
  return route.name === 'page';
}
function isDeleteAPI(route: RouteItem) {
  return route.name === 'delete';
}
function isDetailAPI(route: RouteItem) {
  return route.name === 'getOne';
}
function isAddAPI(route: RouteItem) {
  return route.name === 'add';
}
function isUpdateAPI(route: RouteItem) {
  return route.name === 'update';
}
function defaultGetEntityFromRoute(route: RouteItem) {
  return route.response.type.match(/.([a-zA-Z]+)\[\]/)?.at(-1) || route.response.type;
}
