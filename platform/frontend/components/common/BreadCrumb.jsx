'use client';
import { Breadcrumb } from 'antd';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HomeOutlined } from '@ant-design/icons';
import breadCrumbConfig from '@/lib/config/breadCrumbConfig';

const BreadCrumb = () => {
  const pathname = usePathname();

  const [breadcrumb, setBreadcrumb] = useState([]);

  const genBreadCrumbList = path => {
    const breadcrumbArray = [{ title: <HomeOutlined />, path: '/' }];

    const entry = breadCrumbConfig[path];
    if (entry) {
      breadcrumbArray.push({ title: entry.sectionLabel });
      breadcrumbArray.push({ title: entry.label, path: entry.path });
    }

    return breadcrumbArray;
  };

  useEffect(() => {
    const breadcrumbItems = genBreadCrumbList(pathname);
    setBreadcrumb(breadcrumbItems);
  }, [pathname]);

  return breadcrumb.length > 1 ? (
    <div className="margin-down">
      <Breadcrumb
        items={breadcrumb.map((item, index) => ({
          key: index,
          title:
            index === breadcrumb.length - 1 || !item.path ? (
              item.title
            ) : (
              <Link href={item.path}>{item.title}</Link>
            ),
        }))}
      />
    </div>
  ) : null;
};
export default BreadCrumb;
