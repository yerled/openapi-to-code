import Handlebars from 'handlebars';
import { BaseGenerator, IGeneratorConfig } from './_base';
import { ModuleItem, OpenapiDataParser, RouteItem, TypeItem } from '../parser';
import Log from '../log';
import path from 'path';
import _ from 'lodash';
import {
  FormTemplate,
  HelperTemplate,
  TablePageTemplate,
  AddPageTemplate,
  UpdatePageTemplate,
} from './pages.template';

export type PageGeneratorConfig = IGeneratorConfig & {
  pageFolder?: string;
};

const DEFAULT_PAGE_CONFIG: PageGeneratorConfig = {
  pageFolder: 'pages',
};

export class PageGenerator extends BaseGenerator {
  declare config: PageGeneratorConfig;

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
    const updateRoute = module.routes.find(isUpdateAPI);
    const _entity = this._getTypeByName(entity);
    const formDto =
      this._getTypeByName(getDtoFromType(addRoute?.body.type ?? '')) ||
      this._getTypeByName(getDtoFromType(updateRoute?.body.type ?? ''));
    const _isModalForm = isModalForm(module, formDto);
    const params = {
      _debug: this.config._debug,
      namespace: this.config.namespace,
      moduleName: module.name,
      moduleDesc: module.desc,
      isModalForm: _isModalForm,
      entity: `${this.config.namespace}.${_entity?.name}`,
      entityProps: _entity?.props,
      columnMap: `${capitalizedModuleName}ColumnMap`,
      handleAdd: `handleAdd${capitalizedModuleName}`,
      handleUpdate: `handleUpdate${capitalizedModuleName}`,
      table: `${capitalizedModuleName}Table`,
      gotoTable: `goto${capitalizedModuleName}Table`,
      gotoAdd: `goto${capitalizedModuleName}Add`,
      gotoUpdate: `goto${capitalizedModuleName}Update`,
      form: `${capitalizedModuleName}Form`,
      service: `${module.name}Service`,
      add: `Add${capitalizedModuleName}`,
      tableRoute: route,
      deleteRoute,
      detailRoute,
      addRoute,
      update: `Update${capitalizedModuleName}`,
      updateRoute,
      formDto: formDto,
    };
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `${_.capitalize(_.camelCase(`${module.name}`))}Table.tsx`,
      template: TablePageTemplate,
      params,
    });

    this._generateHelper(params, module);
    if (addRoute) {
      this._generateAddPage(params, module, addRoute);
    }
    if (updateRoute) {
      this._generateUpdatePage(params, module, addRoute);
    }
    if (formDto && _isModalForm) {
      this._generateModalForm(params, module, addRoute);
    }
  }

  private _generateHelper(params: Record<string, any>, module: ModuleItem) {
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `helper.tsx`,
      template: HelperTemplate,
      params,
    });
  }

  private _generateAddPage(params: Record<string, any>, module: ModuleItem, route: RouteItem) {
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `Add.tsx`,
      template: AddPageTemplate,
      params,
    });
  }

  private _generateUpdatePage(params: Record<string, any>, module: ModuleItem, route: RouteItem) {
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder),
      fileName: `Update.tsx`,
      template: UpdatePageTemplate,
      params,
    });
  }

  private _generateModalForm(params: Record<string, any>, module: ModuleItem, route: RouteItem) {
    this.genFile({
      path: path.join(this.config.basePath, module.name, this.config.pageFolder, 'components'),
      fileName: `${params.form}.tsx`,
      template: FormTemplate,
      params,
    });
  }

  private _getTypeByName(name: string) {
    return this.data.types?.find((type) => type.name === name);
  }
}

function isModalForm(module: ModuleItem, type: TypeItem) {
  console.log(module.name, type?.name, type?.props?.length);
  return type?.props.length <= 3;
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
