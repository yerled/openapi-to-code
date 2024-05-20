export const TableConfig = `
import {
  ProColumns,
  ProDescriptionsItemProps,
  ProSchemaValueEnumMap,
} from '@ant-design/pro-components';

type Entity = {{namespace}}.{{entity}}
type Item = ProColumns<Entity> & ProDescriptionsItemProps<Entity>;
export const CouponColumnMap: Record<keyof Entity, Item> = {
  ...({} as Record<keyof Entity, Item>),
  
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
import { FormattedMessage, Link, useIntl } from '@umijs/max';
import { Button, Drawer, Input, Modal, message, Image } from 'antd';
import React, { useRef, useState } from 'react';
import { PublishStatus, PublishStatusEnumMap } from '@/components/PublishStatus/config';
import { PublishStatusTag } from '@/components/PublishStatus/PublishStatusTag';
import DragSortTable, { SortParams } from '@/components/Table/DragSortTable';
import { tagService } from '@/services/server/tag';
import { buildProTableRequest } from '@/services/server/tools';
import TagForm from './components/TagForm';

type Entity = {{namespace}}.{{entity}}

const {{capitalizeName}}Table: React.FC = () => {
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<Entity>();

  const columns: ProColumns<Entity>[] = [
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        
      ],
    },
  ];

  const searchConfig = { defaultCollapsed: false, labelWidth: 64 }
  return (
    <PageContainer>
      <ProTable<Entity, {{namespace}}.PageParams>
        headerTitle='{{moduleDesc}}'
        actionRef={actionRef}
        rowKey="id"
        search={searchProps}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalOpen(true);
            }}
          >
            <PlusOutlined /> <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
          </Button>,
        ]}
        request={buildProTableRequest(tagService.queryPaginatedList, columns)}
        columns={columns}
      />
    </PageContainer>
  );
};

export default {{capitalizedModuleName}}Table;
`;
