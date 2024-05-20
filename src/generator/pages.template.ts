export const TableConfig = `
import {
  ProColumns,
  ProDescriptionsItemProps,
  ProSchemaValueEnumMap,
} from '@ant-design/pro-components';

{{#if debug}}
/**
 entity: {{{stringify entity}}}
 */
{{/if}}

type Entity = {{namespace}}.{{entity.name}}
type Item = ProColumns<Entity> & ProDescriptionsItemProps<Entity>;
export const {{columnMap}}: Record<keyof Entity, Item> = {
  ...({} as Record<keyof Entity, Item>),
  {{#each entity.props}}
  {{name}}: {
    title: '{{desc}}',
    dataIndex: '{{name}}',
    valueType: '{{#if (eq type "number")}}digit{{else}}text{{/if}}',
    search: false,
  },
  {{/each}}
};
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
import { {{columnMap}} } from './tableConfig';
import { {{service}} } from '../services/{{moduleName}}';

type Entity = {{namespace}}.{{entity.name}}

const {{table}}: React.FC = () => {
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<Entity>();

  const actionRef = useRef<ActionType>();

  const columns: ProColumns<Entity>[] = [
    {{#each entity.props}}
    {{../columnMap}}.{{name}},
    {{/each}}
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
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
      <ProTable<Entity, {{namespace}}.PageParams>
        headerTitle='{{moduleDesc}}列表'
        actionRef={actionRef}
        rowKey="id"
        search={searchConfig}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalOpen(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={buildProTableRequest({{service}}.{{tableRoute.name}}, columns)}
        columns={columns}
      />
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
          <ProDescriptions<API.Coupon>
            column={2}
            title="{{moduleDesc}}详情"
            request={async () =>
              {{service}}.{{detailRoute.name}}({ id: String(currentRow.id) }).then((res) => {
                return { data: res };
              })
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
