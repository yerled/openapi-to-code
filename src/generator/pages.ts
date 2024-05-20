import Handlebars from 'handlebars';
import { BaseGenerator, IGeneratorConfig } from './_base';
import { ModuleItem, OpenapiDataParser, RouteItem } from '../parser';
import Log from '../log';
import path from 'path';
import _ from 'lodash';
import { ModalForm, TableConfig, TablePage } from './pages.template';

export type PageGeneratorConfig = IGeneratorConfig & {
  pageFolder?: string;
};

const DEFAULT_PAGE_CONFIG: PageGeneratorConfig = {
  pageFolder: 'pages',
};

export class PageGenerator extends BaseGenerator {
  config: PageGeneratorConfig = DEFAULT_PAGE_CONFIG;

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
    const entity = getEntityFromPageRoute(route);
    const deleteRoute = module.routes.find(isDeleteAPI);
    const detailRoute = module.routes.find(isDetailAPI);
    const addRoute = module.routes.find(isAddAPI);
    const params = {
      debug: this.config.debug,
      namespace: this.config.namespace,
      moduleName: module.name,
      moduleDesc: module.desc,
      entity: this._getTypeByName(entity),
      columnMap: `${capitalizedModuleName}ColumnMap`,
      table: `${capitalizedModuleName}Table`,
      form: `${capitalizedModuleName}ModalForm`,
      service: `${module.name}Service`,
      tableRoute: route,
      deleteRoute,
      detailRoute,
      addRoute,
      addIn: this._getTypeByName(getDtoFromType(addRoute?.body.type ?? '')),
    };
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `${_.capitalize(_.camelCase(`${module.name}`))}Table.tsx`,
      template: TablePage,
      params,
    });

    this._generateTableConfig(module, params);
    if (addRoute) {
      this._generateModalForm(module, params, addRoute);
    }
  }

  private _generateTableConfig(module: ModuleItem, params: Record<string, any>) {
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `tableConfig.tsx`,
      template: TableConfig,
      params,
    });
  }

  private _generateModalForm(module: ModuleItem, params: Record<string, any>, route: RouteItem) {
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder, 'components'),
      fileName: `${params.form}.tsx`,
      template: ModalForm,
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
function getEntityFromPageRoute(route: RouteItem) {
  return route.response.type.match(/.([a-zA-Z]+)\[\]/)?.at(-1) || route.response.type;
}
function getDtoFromType(type: string) {
  return type.split('.').pop() || type;
}
