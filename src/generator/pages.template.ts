export const Helper = `
import {
  ProColumns,
  ProDescriptionsItemProps,
  ProSchemaValueEnumMap,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { {{service}} } from '../services/{{moduleName}}';

{{#if _debug}}
/**
 entity: {{{stringify entityProps}}}
 */
{{/if}}

type Item = ProColumns<{{entity}}> & ProDescriptionsItemProps<{{entity}}>;
export const {{columnMap}}: Record<keyof {{entity}}, Item> = {
  ...({} as Record<keyof {{entity}}, Item>),
  {{#each entityProps}}
  {{name}}: {
    title: '{{placeholder title desc}}',
    dataIndex: '{{name}}',
    valueType: '{{#if (eq type "number")}}digit{{else}}text{{/if}}',
    search: false,
  },
  {{/each}}
};


{{#if addRoute}}
export const {{handleAdd}} = async (fields: {{entity}}) => {
  const hide = message.loading('正在添加');
  try {
    const res = await {{service}}.{{addRoute.name}}({
      ...fields,
    });
    hide();
    message.success('添加成功');
    return res;
  } catch (error) {
    hide();
    return false;
  }
};
{{/if}}

{{#if updateRoute}}
export const {{handleUpdate}} = async (fields: {{entity}}) => {
  const { ...params } = fields;

  const hide = message.loading('正在配置');
  try {
    await {{service}}.{{updateRoute.name}}(params);
    hide();

    message.success('配置成功');
    return true;
  } catch (error) {
    hide();
    return false;
  }
};
{{/if}}
`;

export const TablePage = `
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProDescriptions,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { Button, Drawer, Input, Modal, message, Image } from 'antd';
import React, { useRef, useState } from 'react';
import { buildProTableRequest } from '@/services/server/tools';
import { {{columnMap}}{{#if addRoute}}, {{handleAdd}}{{/if}}{{#if updateRoute}}, {{handleUpdate}}{{/if}} } from './helper';
import { {{service}} } from '../services/{{moduleName}}';
{{#if addRoute}}
import { {{form}} } from './components/{{form}}';
{{/if}}

const {{table}}: React.FC = () => {
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<{{entity}}>();

  const actionRef = useRef<ActionType>();

  const columns: ProColumns<{{entity}}>[] = [
    {{#each entityProps}}
    {{../columnMap}}.{{name}},
    {{/each}}
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Button
          type="link"
          key="detail"
          size="small"
          onClick={() => {
            setCurrentRow(record);
            setShowDetail(true);
          }}
        >
          查看
        </Button>,
        {{#if updateRoute}}
        <Button
          type="link"
          key="update"
          size="small"
          onClick={() => {
            setCurrentRow(record);
            handleUpdateModalOpen(true);
          }}
        >
          编辑
        </Button>,
        {{/if}}
        {{#if deleteRoute}}
        <Button
          key="delete"
          type="text"
          danger
          size="small"
          onClick={async () => {
            Modal.confirm({
              title: '确认删除吗？',
              onOk: async () => {
                const success = await {{service}}.delete({ id: record.id });
                if (success && actionRef.current) {
                  actionRef.current.reload();
                }
              },
            });
          }}
        >
          删除
        </Button>,
        {{/if}}
      ],
    },
  ];

  const searchConfig = { defaultCollapsed: false, labelWidth: 64 }
  return (
    <PageContainer>
      <ProTable<{{entity}}, {{namespace}}.PageParams>
        headerTitle='{{moduleDesc}}列表'
        actionRef={actionRef}
        rowKey="id"
        search={searchConfig}
        toolBarRender={() => [
          {{#if addRoute}}
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalOpen(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
          {{/if}}
        ]}
        request={buildProTableRequest({{service}}.{{tableRoute.name}}, columns)}
        columns={columns}
      />
      {{#if addRoute}}
      <{{form}}
        title="新建{{moduleDesc}}"
        operationType="add"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const success = await {{handleAdd}}(value as {{entity}});
          if (success) {
            handleModalOpen(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      />
      {{/if}}
      {{#if updateRoute}}
      <{{form}}
        title="编辑{{moduleDesc}}"
        operationType="update"
        onFinish={async (value) => {
          const success = await {{handleUpdate}}({ ...currentRow, ...value });
          if (success) {
            handleUpdateModalOpen(false);
            setCurrentRow(undefined);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
        onCancel={() => {
          handleUpdateModalOpen(false);
          if (!showDetail) {
            setCurrentRow(undefined);
          }
        }}
        open={updateModalOpen}
        dataSource={currentRow}
      />
      {{/if}}
      <Drawer
        width={600}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.id && (
          <ProDescriptions<{{entity}}>
            column={2}
            title="{{moduleDesc}}详情"
            request={async () =>
              {{#if detailRoute}}
              {{service}}.{{detailRoute.name}}({ id: String(currentRow.id) }).then((res) => {
                return { data: res };
              })
              {{else}}
              ({ data: currentRow })
              {{/if}}
            }
            columns={Object.values({{columnMap}})}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default {{table}};
`;

export const ModalForm = `
import React, { ComponentProps, useEffect } from 'react';
import { Button, Card, Col, Form, Row } from 'antd';
import {
  FooterToolbar,
  ProForm,
  ProFormSwitch,
  ProFormDependency,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
  ProFormList,
  ModalForm,
} from '@ant-design/pro-components';
import { FormItemRules } from '@/components/Form/config';

{{#if _debug}}
/**
 namespace: {{{namespace}}}
 addIn: {{{stringify addIn}}}
 */
{{/if}}

type FormProps = {
  title: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCancel?: () => void;
  operationType?: 'add' | 'update';
  onFinish?: (values: {{entity}}) => Promise<void>;
  dataSource?: {{entity}};
};

export const {{form}}: React.FC<FormProps> = (props) => {
  const {
    dataSource,
    operationType = 'add',
    onCancel,
    title,
    open,
    onFinish,
    onOpenChange,
  } = props;
  const [form] = Form.useForm<{{entity}}>();

  useEffect(() => {
    if (dataSource) {
      form.setFieldsValue(dataSource);
    }
  }, [dataSource]);

  const modalProps = {
    onCancel,
    styles: { body: { maxHeight: 380, overflow: 'auto' } },
    // destroyOnClose: true,
    maskClosable: false,
  }
  return (
    <ModalForm
      form={form}
      title={title}
      open={open}
      scrollToFirstError
      width={520}
      onFinish={onFinish}
      initialValues={dataSource ? dataSource : undefined}
      onOpenChange={onOpenChange}
      modalProps={modalProps}
    >
      {{#each addIn.props}}
      {{#if (eq type "string")}}
      <ProFormText
        name="{{name}}"
        label="{{placeholder title desc}}"
        rules={[
          {{#if required}}FormItemRules.required,{{/if}}
          {{#if maxLength}}FormItemRules.supportedCharacters, FormItemRules.maxLength{{maxLength}},{{/if}}
        ]}
      />
      {{/if}}
      {{#if (eq type "number")}}
      <ProFormDigit
        name="{{name}}"
        label="{{placeholder title desc}}"
        rules={[
          {{#if required}}FormItemRules.required,{{/if}}
          {{#if max}}{max: {{max}} },{{/if}}
          {{#if min}}{min: {{min}} },{{/if}}
        ]}
      />
      {{/if}}
      {{/each}}
    </ModalForm>
  );
}; 

`;

export const AddPage = `
import React, { useState } from 'react';
import { message, Result, Button, Form } from 'antd';
import moment from 'moment';
import AdvertisementForm from './components/AdvertisementForm';
import { advertisementService } from '@/services/server/advertisement';
import { PageContainer } from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { PublishStatus } from '@/components/PublishStatus/config';

enum PageStatus {
  NORMAL = 0,
  SUCCESS = 1,
}

/**
 *
 * @param fields 添加节点
 * @returns
 */
const handleAdd = async (fields: API.Advertisement) => {
  const hide = message.loading('正在添加');
  try {
    const res = await advertisementService.add({ title: '', img: '', ...fields });
    hide();
    message.success('添加成功');
    return res;
  } catch (error) {
    hide();
    return false;
  }
};

const AddAdvertisement: React.FC = () => {
  const [status, setStatus] = useState(PageStatus.NORMAL);
  const [form] = Form.useForm();
  const refresh = () => {
    setStatus(PageStatus.NORMAL);
    form.resetFields();
  };

  return (
    <PageContainer>
      {status === PageStatus.SUCCESS && (
        <Result
          status="success"
          title={'创建成功'}
          extra={[
            <Button type="primary" key="add" onClick={refresh}>
              {'继续创建'}
            </Button>,
            <Button key="list">
              <Link to="/advertisement">{'返回列表'}</Link>
            </Button>,
          ]}
        />
      )}
      {status === PageStatus.NORMAL && (
        <AdvertisementForm
          operationType="add"
          onFinish={async (value: API.Advertisement) => {
            const success = await handleAdd({
              ...value,
            });
            if (success) {
              setStatus(PageStatus.SUCCESS);
            }
          }}
        />
      )}
    </PageContainer>
  );
};

export default AddAdvertisement;

`;
