import React from 'react';
import KeepAlive from 'react-activation';
import { Divide } from 'docs/components';
import AdvancedUsage from 'docs/sections/advanced-usage';
import MoreConfiguration from 'docs/sections/more-configuration/Index';
import QuickStart from 'docs/sections/quick-start';
import UsageNotes from 'docs/sections/usage-notes';

const Introduction = () => {
  return (
    <KeepAlive>
      <main>
        {/* 快速开始 */}
        <QuickStart />
        {/* 更多配置 */}
        <MoreConfiguration />
        {/* 进阶使用 */}
        <AdvancedUsage />
        {/* 使用注意 */}
        <UsageNotes />
        {/* 开发作者 */}
        <Divide title="By.huanjinliu" href="https://github.com/huanjinliu" />
      </main>
    </KeepAlive>
  );
};

export default Introduction;
