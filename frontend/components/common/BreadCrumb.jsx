'use client';
import { Breadcrumb } from 'antd';
import Link from 'next/link';
import React, { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HomeOutlined } from '@ant-design/icons';
import breadCrumbConfig from '@/lib/config/breadCrumbConfig';

const BreadCrumb = () => {
  const pathname = usePathname();

  const [breadcrumb, setBreadcrumb] = useState([]);

  const genBreadCrumbList = path => {
    const pathArray = path.split('/').filter(p => p);
    const breadcrumbArray = [{ title: <HomeOutlined />, path: '/' }];

    const findPath = (currentMap, segments) => {
      if (!segments.length) return;

      const segment = segments.shift();
      if (currentMap[segment]) {
        const currentSegment = currentMap[segment];
        if (currentSegment.name) {
          breadcrumbArray.push({ title: currentSegment.name, path: currentSegment.path });
        }
        findPath(currentSegment.children || {}, segments);
      }
    };
    //console.log(pathArray);
    findPath(breadCrumbConfig, pathArray);
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
